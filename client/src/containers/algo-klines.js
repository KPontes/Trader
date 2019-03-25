import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import axios from "axios";
import validator from "validator";

import { selectUser } from "../actions/root";
import sysconfig from "../config";

class AlgoKLines extends Component {
  constructor(props) {
    super(props);
    this.handleChangeClick = this.handleChangeClick.bind(this);
    this.onAlgoChange = this.onAlgoChange.bind(this);
    this.onInputChange = this.onInputChange.bind(this);

    let userPair = this.props.user.monitor[this.props.index];
    let checked = userPair.algos.indexOf("KLINES") === -1 ? false : true;
    let userRules = userPair.configrule.klines;
    this.state = {
      checked,
      minVariation: Number(userRules[0]) * 100,
      group: userRules[1],
      trend: userRules[2]
    };
  }

  btns() {
    let btns = (
      <div className="row">
        <div className="col-md-12" align="center">
          <button
            type="button"
            className="btn btn-primary cursor-pointer mr-3"
            id="submit"
            onClick={event => this.handleChangeClick()}
          >
            Submit Changes
          </button>
          <p className="text-danger"> {this.state.msg}</p>
        </div>
      </div>
    );
    return btns;
  }

  panel() {
    let userPair = this.props.user.monitor[this.props.index];
    let cfg = (
      <span>
        <div className="row">
          <div className="col-md-12">
            <h5> Candle Analysis</h5>
            <span className="col-md-2 ml-2">
              <input
                className="form-check-input"
                type="checkbox"
                value="KLINES"
                id="KLINES"
                name="KLINES"
                checked={this.state.checked}
                onChange={this.onAlgoChange}
              />
              <label className="form-check-label">use in trade decision</label>
              <br />
            </span>
          </div>
        </div>
        <div className="row">
          <div className="col-md-5">
            <p>
              <b>Calculation Parameters</b>
            </p>
            Load last 500 candle sticks for configured interval
          </div>
          <div className="col-md-7">
            <p>
              <b>Business Rules </b>
            </p>
            Minimum variation (%)
            <input
              type="text"
              className="form-control form-control-sm w-50"
              id="basePeriods"
              placeholder="Value"
              value={this.state.minVariation}
              onChange={this.onInputChange}
            />
            <br />
            Group size (in number of candle sticks)
            <input
              type="text"
              className="form-control form-control-sm w-50"
              id="group"
              placeholder="Value"
              value={this.state.group}
              onChange={this.onInputChange}
            />
            <br />
            <b>Variation rules:</b> suggest buy or sell when variation between close and open values
            of last candle, or last Group, is greater than minimum variation.
            <br />
            <b> Direction rules:</b> Same direction (up or down) to all candles of the Group,
            denotes a trend.
            <br />
            <b> Trend inversion rules:</b> Last N candles with same direction (up or down), except
            for the last candle.
            <br />
            <br />
            Number of candles (N) to calculate trend inversion
            <input
              type="text"
              className="form-control form-control-sm w-50"
              id="trend"
              placeholder="Value"
              value={this.state.trend}
              onChange={this.onInputChange}
            />
          </div>
        </div>
      </span>
    );
    return cfg;
  }

  validateAlgo() {
    if (
      !validator.isNumeric(this.state.minVariation.toString()) ||
      !validator.isInt(this.state.group.toString()) ||
      !validator.isInt(this.state.trend.toString())
    ) {
      return "Invalid number";
    }
    if (parseInt(this.state.group, 10) < 2) return "Group must be greater than 2";
    if (parseInt(this.state.trend, 10) < 2) return "Number for trend must be greater than 2";
    if (Number(this.state.trendPeriods) > 100) return "Must be smaller than 100 periods";

    return "OK";
  }

  onInputChange(event) {
    this.setState({
      [event.target.id]: event.target.value.toString().trim()
    });
  }

  handleChangeClick() {
    try {
      let msg = this.validateAlgo();
      if (msg !== "OK") return alert("Error: " + msg);
      let arrRules = [
        parseFloat(this.state.minVariation / 100),
        parseInt(this.state.group, 10),
        parseInt(this.state.trend, 10)
      ];
      let algo = this.state.checked ? { KLINES: true } : { KLINES: false };
      let userPair = this.props.user.monitor[this.props.index];
      let configcalc = userPair.configcalc;
      let configrule = userPair.configrule;
      configrule.klines = arrRules;
      let data = {
        email: this.props.user.email,
        symbol: userPair.symbol,
        index: this.props.index,
        algo,
        configcalc,
        configrule
      };
      var _this = this;
      axios({
        method: "patch",
        baseURL: sysconfig.EXECUTER_URI,
        url: "/usersymbol/updatealgo",
        data,
        headers: { "x-auth": _this.props.token }
      })
        .then(function(response) {
          if (response.status === 200) {
            _this.props.selectUser(response.data);
            _this.state.msg = "KLINES data saved!";
          }
        })
        .catch(function(error) {
          console.log(error);
          alert("Err KLines: " + error.response.data.message);
        });
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  onAlgoChange(event) {
    if (event.target.id === "KLINES") {
      let checked = !this.state.checked;
      this.setState({
        checked
      });
    }
  }

  render() {
    let panel = this.panel();
    let btns = this.btns();
    return (
      <span>
        {panel} <br />
        {btns}
      </span>
    );
  }
}

function mapStateToProps(state) {
  //whatever is returned will show as props inside this container
  return {
    token: state.activeToken,
    user: state.activeUser
  };
}

//anything returned from this function will become props on this container
function mapDispatchToProps(dispatch) {
  //whenever selectToken is called, the result will be passed to all reducers
  return bindActionCreators({ selectUser: selectUser }, dispatch);
}

//promote Login from a component to a container with added props activeToken
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AlgoKLines);

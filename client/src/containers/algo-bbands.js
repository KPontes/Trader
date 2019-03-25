import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import axios from "axios";
import validator from "validator";

import { selectUser } from "../actions/root";
import sysconfig from "../config";

class AlgoBBands extends Component {
  constructor(props) {
    super(props);
    this.handleChangeClick = this.handleChangeClick.bind(this);
    this.onAlgoChange = this.onAlgoChange.bind(this);
    this.onInputChange = this.onInputChange.bind(this);

    let userPair = this.props.user.monitor[this.props.index];
    let checked = userPair.algos.indexOf("BBANDS") === -1 ? false : true;
    let indicatorCalc = this.props.indicator.params;
    let userCalc = userPair.configcalc.bbands;
    let userRules = userPair.configrule.bbands;
    this.state = {
      checked,
      basePeriods: userCalc[0],
      trendPeriods: userRules[0],
      count: userRules[1],
      indicatorCalc
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
    let allowedValues = "[" + this.state.indicatorCalc + "]";
    let multiplier = 2;
    if (Number(this.state.basePeriods) > 20) multiplier = 2.1;
    if (Number(this.state.basePeriods) < 20) multiplier = 1.9;
    let cfg = (
      <span>
        <div className="row">
          <div className="col-md-12">
            <h5> Borllinger Bands</h5>
            <span className="col-md-2 ml-2">
              <input
                className="form-check-input"
                type="checkbox"
                value="BBANDS"
                id="BBANDS"
                name="BBANDS"
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
              <p>
                <small>Allowed values: {allowedValues}</small>
              </p>
            </p>
            Base number of periods for Calculation
            <input
              type="text"
              className="form-control form-control-sm w-50"
              id="basePeriods"
              placeholder="Value"
              value={this.state.basePeriods}
              onChange={this.onInputChange}
            />
            <br />
            Middle band: {this.state.basePeriods} days SMA
            <br />
            Upper band: Middle plus {this.state.basePeriods} days standard deviation x {multiplier}
            <br />
            Lower band: Middle minus {this.state.basePeriods} days standard deviation x {multiplier}
          </div>
          <div className="col-md-7">
            <p>
              <b>Business Rules </b>
            </p>
            Overbought signal: candle close above upperband
            <br />
            Oversold signal: candle close bellow lowerband
            <br />
            Recent periods for trend identification
            <input
              type="text"
              className="form-control form-control-sm w-50"
              id="trendPeriods"
              placeholder="Value"
              value={this.state.trendPeriods}
              onChange={this.onInputChange}
            />
            <br />
            Count of candles on overbought or oversold situation on recent periods. More
            occurrencies than <u>count</u> means a continuity of trend with "walking the band"
            situation.
            <br />
            <br />
            Count overbought / oversold
            <input
              type="text"
              className="form-control form-control-sm w-50"
              id="count"
              placeholder="Value"
              value={this.state.count}
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
      !validator.isInt(this.state.basePeriods.toString()) ||
      !validator.isInt(this.state.trendPeriods.toString()) ||
      !validator.isInt(this.state.count.toString())
    ) {
      return "Invalid integer number";
    }
    if (this.state.indicatorCalc.indexOf(this.state.basePeriods.toString()) === -1)
      return "Invalid base period";
    if (Number(this.state.trendPeriods) < 1 || Number(this.state.trendPeriods) > 120)
      return "Trend periods must be between 1 and 120";
    if (Number(this.state.trendPeriods) < 2) return "Must be greater than 2 periods";

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
      let arrRules = [parseInt(this.state.basePeriods, 10), parseInt(this.state.count, 10)];
      let algo = this.state.checked ? { BBANDS: true } : { BBANDS: false };
      let userPair = this.props.user.monitor[this.props.index];
      let configcalc = userPair.configcalc;
      configcalc.bbands = [parseInt(this.state.basePeriods, 10)];
      let configrule = userPair.configrule;
      configrule.bbands = arrRules;
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
            _this.state.msg = "BBANDS data saved!";
          }
        })
        .catch(function(error) {
          console.log(error);
          alert("Err BBANDS: " + error.response.data.message);
        });
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  onAlgoChange(event) {
    if (event.target.id === "BBANDS") {
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
)(AlgoBBands);

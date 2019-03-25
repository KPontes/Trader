import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import axios from "axios";
import validator from "validator";

import { selectUser } from "../actions/root";
import sysconfig from "../config";

class AlgoRSI extends Component {
  constructor(props) {
    super(props);
    this.handleChangeClick = this.handleChangeClick.bind(this);
    this.onAlgoChange = this.onAlgoChange.bind(this);
    this.onInputChange = this.onInputChange.bind(this);

    let userPair = this.props.user.monitor[this.props.index];
    let checked = userPair.algos.indexOf("RSI") === -1 ? false : true;
    let indicatorCalc = this.props.indicator.params;
    let userCalc = userPair.configcalc.rsi;
    let userRules = userPair.configrule.rsi;
    this.state = {
      checked,
      basePeriods: userCalc[0],
      bottom: userRules[0],
      top: userRules[1],
      trendPeriods: userRules[2],
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
    let cfg = (
      <span>
        <div className="row">
          <div className="col-md-12">
            <h5> Relative Strength Index</h5>
            <span className="col-md-2 ml-2">
              <input
                className="form-check-input"
                type="checkbox"
                value="RSI"
                id="RSI"
                name="RSI"
                checked={this.state.checked}
                onChange={this.onAlgoChange}
              />
              <label className="form-check-label">use in trade decision</label>
              <br />
            </span>
          </div>
        </div>
        <div className="row">
          <div className="col-md-4">
            <p>
              <b>Calculation Parameters</b>
              <p>
                <small>Allowed values: {allowedValues}</small>
              </p>
            </p>
            Base number of periods:
            <input
              type="text"
              className="form-control form-control-sm w-50"
              id="basePeriods"
              placeholder="Value"
              value={this.state.basePeriods}
              onChange={this.onInputChange}
            />
          </div>
          <div className="col-md-8">
            <p>
              <b>Business Rules </b>
            </p>
            Oversold signal bottom line:
            <input
              type="text"
              className="form-control form-control-sm w-50"
              id="bottom"
              placeholder="Value"
              value={this.state.bottom}
              onChange={this.onInputChange}
            />
            <br />
            Overbought signal top line:
            <input
              type="text"
              className="form-control form-control-sm w-50"
              id="top"
              placeholder="Value"
              value={this.state.top}
              onChange={this.onInputChange}
            />
            <br />
            Recent periods:
            <input
              type="text"
              className="form-control form-control-sm w-50"
              id="trendPeriods"
              placeholder="Value"
              value={this.state.trendPeriods}
              onChange={this.onInputChange}
            />
            <br />
            Recent RSI calculation periods resulting on gains or losses used to determine continuity
            or reversal of trend
          </div>
        </div>
      </span>
    );
    return cfg;
  }

  validateAlgo() {
    if (
      !validator.isInt(this.state.top.toString()) ||
      !validator.isInt(this.state.bottom.toString()) ||
      !validator.isInt(this.state.basePeriods.toString()) ||
      !validator.isInt(this.state.trendPeriods.toString())
    ) {
      return "Invalid integer number";
    }
    if (this.state.indicatorCalc.indexOf(this.state.basePeriods.toString()) === -1)
      return "Invalid base period";
    if (Number(this.state.top) <= Number(this.state.bottom))
      return "Top must be greater than bottom";
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
        parseInt(this.state.bottom, 10),
        parseInt(this.state.top, 10),
        parseInt(this.state.trendPeriods, 10)
      ];
      let algo = this.state.checked ? { RSI: true } : { RSI: false };
      let userPair = this.props.user.monitor[this.props.index];
      let configcalc = userPair.configcalc;
      configcalc.rsi = [parseInt(this.state.basePeriods, 10)];
      let configrule = userPair.configrule;
      configrule.rsi = arrRules;
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
            _this.state.msg = "RSI data saved!";
          }
        })
        .catch(function(error) {
          console.log(error);
          alert("Err RSI: " + error.response.data.message);
        });
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  onAlgoChange(event) {
    if (event.target.id === "RSI") {
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
)(AlgoRSI);

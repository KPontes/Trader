import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import axios from "axios";
import validator from "validator";

import { selectUser } from "../actions/root";
import sysconfig from "../config";

class AlgoEMA extends Component {
  constructor(props) {
    super(props);
    this.handleChangeClick = this.handleChangeClick.bind(this);
    this.onAlgoChange = this.onAlgoChange.bind(this);
    this.onInputChange = this.onInputChange.bind(this);

    let userPair = this.props.user.monitor[this.props.index];
    let checked = userPair.algos.indexOf("EMA") === -1 ? false : true;
    let indicatorCalc = this.props.indicator.params;
    //if user has no ema pre configured, use indicator table as input params
    let usercalc = userPair.configcalc.ema ? userPair.configcalc.ema : indicatorCalc;
    this.state = {
      checked,
      short: usercalc[0],
      middle: usercalc[1],
      long: usercalc[2],
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
            <h5> Exponential Moving Average</h5>
            <span className="col-md-2 ml-2">
              <input
                className="form-check-input"
                type="checkbox"
                value="EMA"
                id="EMA"
                name="EMA"
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
            Short line:
            <input
              type="text"
              className="form-control form-control-sm w-50"
              id="short"
              placeholder="Value"
              value={this.state.short}
              onChange={this.onInputChange}
            />
            Middle line:
            <input
              type="text"
              className="form-control form-control-sm w-50"
              id="middle"
              placeholder="Value"
              value={this.state.middle}
              onChange={this.onInputChange}
            />
            Long line:
            <input
              type="text"
              className="form-control form-control-sm w-50"
              id="long"
              placeholder="Value"
              value={this.state.long}
              onChange={this.onInputChange}
            />
          </div>
          <div className="col-md-7">
            <p>
              <b>Business Rules </b>
            </p>
            Buy when short line above medium and medium above long.
            <br />
            Sell when short line bellow medium and medium bellow long.
          </div>
        </div>
      </span>
    );
    return cfg;
  }

  validateAlgo() {
    if (
      !validator.isInt(this.state.short.toString()) ||
      !validator.isInt(this.state.middle.toString()) ||
      !validator.isInt(this.state.long.toString())
    ) {
      return "Invalid integer number";
    }
    if (this.state.indicatorCalc.indexOf(this.state.short.toString()) === -1)
      return "Invalid Short";
    if (this.state.indicatorCalc.indexOf(this.state.middle.toString()) === -1)
      return "Invalid Middle";
    if (this.state.indicatorCalc.indexOf(this.state.long.toString()) === -1) return "Invalid Long";

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
      let arrCalc = [
        parseInt(this.state.short, 10),
        parseInt(this.state.middle, 10),
        parseInt(this.state.long, 10)
      ].sort((a, b) => a - b);
      let algo = this.state.checked ? { EMA: true } : { EMA: false };
      let userPair = this.props.user.monitor[this.props.index];
      let configcalc = userPair.configcalc;
      configcalc.ema = arrCalc;
      let configrule = userPair.configrule;
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
            _this.state.msg = "EMA data saved!";
          }
        })
        .catch(function(error) {
          console.log(error);
          alert("Err Numbers: " + error.response.data.message);
        });
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  onAlgoChange(event) {
    if (event.target.id === "EMA") {
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
)(AlgoEMA);

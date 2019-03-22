import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import axios from "axios";
import validator from "validator";

import { selectUser } from "../actions/root";
import sysconfig from "../config";

class AlgoSMA extends Component {
  constructor(props) {
    super(props);
    this.handleChangeClick = this.handleChangeClick.bind(this);
    this.onAlgoChange = this.onAlgoChange.bind(this);
    this.onInputChange = this.onInputChange.bind(this);

    let userPair = this.props.user.monitor[this.props.index];
    let checked = userPair.algos.indexOf("MA") === -1 ? false : true;
    let indicatorCalc = this.props.indicator.params;
    let usercalc = userPair.configcalc.sma;
    this.state = {
      checked,
      xShort: usercalc[0],
      short: usercalc[1],
      middle: usercalc[2],
      long: usercalc[3],
      slice: userPair.configrule.sma[0],
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
            <h5> Simple Moving Average</h5>
            <span className="col-md-2 ml-2">
              <input
                className="form-check-input"
                type="checkbox"
                value="MA"
                id="MA"
                name="MA"
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
            x-Short line:
            <input
              type="text"
              className="form-control form-control-sm w-50"
              id="xShort"
              placeholder="Value"
              value={this.state.xShort}
              onChange={this.onInputChange}
            />
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
            <div className="row">
              <div className="col-md-6">Trend signal, considering the last </div>
              <div className="col-md-6" align="left">
                <input
                  type="text"
                  className="form-control form-control-sm w-25"
                  id="slice"
                  placeholder="Value"
                  value={this.state.slice}
                  onChange={this.onInputChange}
                />{" "}
              </div>
            </div>
            <div className="row">
              <div className="col-md-12">
                averages of x-Short on same direction, indicating up or down trend.
                <p>
                  <small>
                    Valid values: <br />
                    zero to ignore rule; <br /> or a number between 2 and xShort line to evaluate
                    trend.
                  </small>
                </p>
              </div>
            </div>
          </div>
        </div>
      </span>
    );
    return cfg;
  }

  validateAlgo() {
    if (
      !validator.isInt(this.state.xShort.toString()) ||
      !validator.isInt(this.state.short.toString()) ||
      !validator.isInt(this.state.middle.toString()) ||
      !validator.isInt(this.state.long.toString()) ||
      !validator.isInt(this.state.slice.toString())
    ) {
      return "Invalid integer number";
    }
    if (this.state.indicatorCalc.indexOf(this.state.xShort.toString()) === -1)
      return "Invalid xShort";
    if (this.state.indicatorCalc.indexOf(this.state.short.toString()) === -1)
      return "Invalid Short";
    if (this.state.indicatorCalc.indexOf(this.state.middle.toString()) === -1)
      return "Invalid Middle";
    if (this.state.indicatorCalc.indexOf(this.state.long.toString()) === -1) return "Invalid Long";
    let slice = Number(this.state.slice);
    if (slice !== 0 && (slice < 2 || slice > Number(this.state.xShort)))
      return "Invalid rule value";

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

      let arrCalc = [this.state.xShort, this.state.short, this.state.middle, this.state.long].sort(
        (a, b) => a - b
      );
      let userPair = this.props.user.monitor[this.props.index];
      let configcalc = userPair.configcalc;
      configcalc.sma = arrCalc;
      let configrule = userPair.configrule;
      configrule.sma = [this.state.slice];
      let data = {
        email: this.props.user.email,
        symbol: userPair.symbol,
        index: this.props.index,
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
            _this.state.msg = "SMA data saved!";
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
    if (event.target.id === "MA") {
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
)(AlgoSMA);

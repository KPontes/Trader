import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import axios from "axios";
import validator from "validator";

import { selectUser } from "../actions/root";
import sysconfig from "../config";

class AlgoMACD extends Component {
  constructor(props) {
    super(props);
    this.handleChangeClick = this.handleChangeClick.bind(this);
    this.onAlgoChange = this.onAlgoChange.bind(this);
    this.onInputChange = this.onInputChange.bind(this);

    let userPair = this.props.user.monitor[this.props.index];
    let checked = userPair.algos.indexOf("MACD") === -1 ? false : true;
    let indicatorCalc = this.props.indicator.params;
    let userCalc = userPair.configcalc.macd;
    this.state = {
      checked,
      short: userCalc[0],
      long: userCalc[1],
      signal: userCalc[2],
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
    let cont = 0;
    let allowedValues = this.state.indicatorCalc.map(elem => {
      cont += 1;
      if (cont % 3 === 0) {
        let partial = this.state.indicatorCalc.slice(cont - 3, cont);
        return "[" + partial + "]";
      }
    });
    let cfg = (
      <span>
        <div className="row">
          <div className="col-md-12">
            <h5> Moving Average Convergence Divergence</h5>
            <span className="col-md-2 ml-2">
              <input
                className="form-check-input"
                type="checkbox"
                value="MACD"
                id="MACD"
                name="MACD"
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
            <br />
            Long line:
            <input
              type="text"
              className="form-control form-control-sm w-50"
              id="long"
              placeholder="Value"
              value={this.state.long}
              onChange={this.onInputChange}
            />
            <br />
            Signal line:
            <input
              type="text"
              className="form-control form-control-sm w-50"
              id="signal"
              placeholder="Value"
              value={this.state.signal}
              onChange={this.onInputChange}
            />
          </div>
          <div className="col-md-7">
            <p>
              <b>Business Rules </b>
            </p>
            Buy signals:
            <ul className="list-none">
              <li>MACD Line greater than Signal </li>
              <li> MACD Line greater than 0 </li> <li> Short greater than Long</li>
            </ul>
            Sell signals:
            <ul className="list-none">
              <li>MACD Line smaller than Signal </li>
              <li> MACD Line smaller than 0 </li> <li> Short line bellow Long</li>
            </ul>
          </div>
        </div>
      </span>
    );
    return cfg;
  }

  validateAlgo() {
    if (
      !validator.isInt(this.state.short.toString()) ||
      !validator.isInt(this.state.long.toString()) ||
      !validator.isInt(this.state.signal.toString())
    ) {
      return "Invalid integer number";
    }
    let cont = 0; //macd uses groups of 3 params for calculation
    let match = false;
    for (let elem of this.state.indicatorCalc) {
      cont += 1;
      if (cont % 3 === 0) {
        let params = this.state.indicatorCalc.slice(cont - 3, cont);
        if (
          Number(this.state.short) === Number(params[0]) &&
          Number(this.state.long) === Number(params[1]) &&
          Number(this.state.signal) === Number(params[2])
        ) {
          match = true;
        }
      }
    }
    if (!match) return "Numbers out of allowed values";

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
      let algo = this.state.checked ? { MACD: true } : { MACD: false };
      let userPair = this.props.user.monitor[this.props.index];
      let configcalc = userPair.configcalc;
      configcalc.macd = [
        parseInt(this.state.short, 10),
        parseInt(this.state.long, 10),
        parseInt(this.state.signal, 10)
      ];
      let configrule = userPair.configrule; //macd has no configurable business rules
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
            _this.state.msg = "MACD data saved!";
          }
        })
        .catch(function(error) {
          console.log(error);
          alert("Err MACD: " + error.response.data.message);
        });
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  onAlgoChange(event) {
    if (event.target.id === "MACD") {
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
)(AlgoMACD);

import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import axios from "axios";

import sysconfig from "../config";
import { selectUser } from "../actions/root";
import AlgoSMA from "./algo-sma";
import AlgoEMA from "./algo-ema";
import AlgoMACD from "./algo-macd";
import AlgoRSI from "./algo-rsi";
import AlgoBBands from "./algo-bbands";
import AlgoKLines from "./algo-klines";

class AlgoPanel extends Component {
  constructor(props) {
    super(props);
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
    let index = this.props.index;
    let symbol = this.props.user.monitor[index].symbol;
    this.getIndicators("1m");
    this.state = {
      symbol: symbol,
      algo: "",
      msg: ""
    };
  }

  getIndicators(period) {
    let url = `/indicator/list?period=${period}`;
    var _this = this;
    axios({
      method: "get",
      baseURL: sysconfig.EXECUTER_URI,
      url
    })
      .then(function(response) {
        if (response.data) {
          _this.setState({ indicator: response.data });
        }
      })
      .catch(function(error) {
        console.log("Err getIndicators:", error);
      });
  }

  generalInfo() {
    let index = this.props.index;
    let monitor = this.props.user.monitor[index];
    let list = monitor.algos.map(element => {
      return "[" + element + "]  ";
    });
    let panel = (
      <span>
        <div className="row">
          <div className="col-md-12">
            Currently selected algorithms
            <br />
            <small>{list} </small>
          </div>
        </div>
        <div className="row mt-2">
          <div className="col-md-12">
            General Summary Rule
            <br />
            <small>
              Trade when absolute majority of indicators shows same direction (buy or sell).
            </small>
          </div>
        </div>
      </span>
    );
    return panel;
  }

  handleOptionChange(changeEvent) {
    if (!this.state.indicator) this.getIndicators();
    let selectedIndicator = this.state.indicator.filter(elem => {
      return elem.name.toUpperCase() === changeEvent.target.value.toUpperCase();
    });
    this.setState({
      algo: changeEvent.target.value.toUpperCase(),
      msg: "",
      selectedIndicator: selectedIndicator[0]
    });
  }

  handleCloseClick(changeEvent) {
    this.props.sendData("hide-algo-panel"); //send to parent
  }

  showAlgorithm() {
    //let userPair = this.props.user.monitor[this.props.index];
    let result = <div />;
    let genInfo = this.generalInfo();
    let indicator = this.state.selectedIndicator;
    let index = this.props.index;
    switch (this.state.algo.toUpperCase()) {
      case "SMA":
        result = <AlgoSMA index={index} indicator={indicator} />;
        break;
      case "EMA":
        result = <AlgoEMA index={index} indicator={indicator} />;
        break;
      case "MACD":
        result = <AlgoMACD index={index} indicator={indicator} />;
        break;
      case "RSI":
        result = <AlgoRSI index={index} indicator={indicator} />;
        break;
      case "BBANDS":
        result = <AlgoBBands index={index} indicator={indicator} />;
        break;
      case "KLINES":
        result = <AlgoKLines index={index} indicator={indicator} />;
        break;
      default:
        result = genInfo;
        break;
    }
    return <div className="col-md-9">{result}</div>;
  }

  selectAlgorithm() {
    const opts = () => {
      return ["Select"].concat(sysconfig.Algos).map(element => {
        return (
          <option id={element.toUpperCase()} value={element.toUpperCase()}>
            {element}
          </option>
        );
      });
    };

    var lista = opts();
    let cfgAlgo = this.showAlgorithm();
    let details;
    if (this.props.user) {
      details = (
        <div>
          <div className="row">
            <div className="col-md-2">
              <label className="ml-2">
                <b>Select Algorithm</b>
              </label>
            </div>
            <div className="col-md-10" align="right">
              <button
                type="button"
                className="close"
                aria-label="Close"
                onClick={event => this.handleCloseClick(event)}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          </div>
          <div className="row">
            <div className="col-md-3">
              <select
                className="form-control ml-2 w-75"
                id="algos"
                value={this.state.algo}
                onChange={this.handleOptionChange}
              >
                {lista}
              </select>
            </div>
            {cfgAlgo}
          </div>
        </div>
      );
    }
    return details;
  }

  render() {
    let panel = <div />;
    // if (this.props.field === "symbol") {
    panel = this.selectAlgorithm();
    //}
    return (
      <div className="presentation-div">
        <div className="form-group">{panel}</div>
      </div>
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
)(AlgoPanel);

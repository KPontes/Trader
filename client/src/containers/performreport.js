import React, { Component } from "react";
import axios from "axios";
import { connect } from "react-redux";

import sysconfig from "../config";
import Menu from "../components/menu";
import PerformList from "../components/performlist";

class PerformanceReport extends Component {
  constructor(props) {
    super(props);
    this.handleBtnClick = this.handleBtnClick.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
    this.handleCheckChange = this.handleCheckChange.bind(this);
    this.getData = this.getData.bind(this);
    let startDate = new Date(this.props.user.createdAt);
    this.state = {
      exchange: "binance",
      trades: [],
      symbol: "",
      tradelist: "show",
      startDate,
      mode: "real",
      btnEnabled: true
    };
  }

  showFilters() {
    const opts = () => {
      return ["Select"].concat(sysconfig.Symbols).map(element => {
        return (
          <option id={element} value={element}>
            {element}
          </option>
        );
      });
    };

    let test = this.state.mode === "test";
    let real = this.state.mode === "real";
    var lista = opts();
    let btnLine = this.btns();
    let details = (
      <div>
        <div className="row">
          <div className="col-md-6">
            <label>
              <b>Performance Report</b>
            </label>
          </div>
        </div>
        <div className="row">
          <div className="col-md-3">
            <label>
              <b>Exchange</b>
            </label>
          </div>
          <div className="col-md-3">
            <label>
              <b>Symbol</b>
            </label>
          </div>
          <div className="col-md-2">
            <label>
              <b>Mode</b>
            </label>
          </div>
        </div>
        <div className="row">
          <div className="col-md-3">
            <input
              className="form-check-input"
              type="checkbox"
              value={this.state.exchange}
              disabled
              id="exchange"
              checked
            />
            <label className="form-check-label">{this.state.exchange.toUpperCase()}</label>
          </div>
          <div className="col-md-3">
            <select
              className="form-control"
              id="symbols"
              value={this.state.symbol}
              onChange={this.handleOptionChange}
            >
              {lista}
            </select>
          </div>
          <div className="form-group col-md-2 p-1">
            <span className="border border-secondary p-2">
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input "
                  type="radio"
                  id="checkTest"
                  value="test"
                  checked={test}
                  onChange={this.handleCheckChange}
                />
                <label className="form-check-label">test</label>
              </div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  id="checkReal"
                  value="real"
                  checked={real}
                  onChange={this.handleCheckChange}
                />
                <label className="form-check-label">real</label>
              </div>
            </span>
          </div>
          {btnLine}
        </div>
      </div>
    );

    return details;
  }

  btns() {
    let btns = (
      <div className="col-md-2">
        <button
          type="button"
          className="btn btn-primary btn-sm cursor-pointer"
          id="generate"
          disabled={!this.state.btnEnabled}
          onClick={event => this.handleBtnClick(event)}
        >
          Generate
        </button>

        <p className="text-danger"> {this.state.msg}</p>
      </div>
    );
    return btns;
  }

  handleCheckChange(changeEvent) {
    this.setState({
      mode: changeEvent.target.value
    });
  }

  handleBtnClick(event) {
    try {
      let _this = this;
      axios({
        method: "post",
        baseURL: sysconfig.EXECUTER_URI,
        url: "/trade/list",
        data: {
          email: this.props.user.email,
          symbol: this.state.symbol,
          startDate: this.state.startDate,
          mode: this.state.mode
        },
        headers: { "x-auth": this.props.token }
      })
        .then(function(response) {
          if (response.data) {
            _this.setState({ trades: response.data, btnEnabled: false, tradelist: "show" });
          }
        })
        .catch(function(error) {
          console.log(error);
        });
      // let url = `${sysconfig.EXECUTER_URI}/trade/perform?symbol=${this.state.symbol}`;
      // axios
      //   .get(url)
      //   .then(function(response) {
      //     if (response.data) {
      //       _this.setState({ trades: response.data, btnEnabled: false, tradelist: "show" });
      //     }
    } catch (e) {
      console.log(e);
    }
  }

  getData(val) {
    //receive data from child component
    if (val === "hide") {
      this.setState({ tradelist: "hide", btnEnabled: true });
    }
  }

  render() {
    let role = this.props.user ? this.props.user.role : false;
    let filter = this.showFilters();
    let panel = <div />;
    if (this.state.tradelist !== "hide") {
      panel = <PerformList sendData={this.getData} trades={this.state.trades} />;
    }
    return (
      <div className="container">
        <Menu logged={role} />
        <div className="form-group">{filter}</div>
        {panel}
      </div>
    );
  }

  handleOptionChange(changeEvent) {
    this.setState({
      symbol: changeEvent.target.value,
      msg: ""
    });
  }
}

function mapStateToProps(state) {
  //whatever is returned will show as props inside this container
  return {
    user: state.activeUser,
    token: state.activeToken
  };
}

//promote Login from a component to a container with added props activeToken
export default connect(mapStateToProps)(PerformanceReport);

import React, { Component } from "react";
import axios from "axios";
import validator from "validator";
import { connect } from "react-redux";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import sysconfig from "../config";
import Menu from "../components/menu";
import TradeList from "../components/tradelist";

class TradeReport extends Component {
  constructor(props) {
    super(props);
    this.handleBtnClick = this.handleBtnClick.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    let startDate = new Date(this.props.user.createdAt);
    //startDate = startDate.toLocaleDateString("en-US");
    let symbol = this.props.user.monitor[0].symbol;
    this.state = {
      trades: [],
      startDate,
      symbol
    };
  }

  showFilters() {
    const opts = () => {
      if (this.props.user) {
        return this.props.user.monitor.map(element => {
          return (
            <option id={element.symbol} value={element.symbol}>
              {element.symbol}
            </option>
          );
        });
      }
    };

    var lista = opts();
    let btnLine = this.btns();
    let details;
    if (this.props.user) {
      details = (
        <div>
          <div className="row">
            <div className="col-md-6">
              <label>
                <b>Trades Report</b>
              </label>
            </div>
          </div>
          <div className="row">
            <div className="col-md-3">
              <label>
                <b>Symbol</b>
              </label>
            </div>
            <div className="col-md-3">
              <label>
                <b>Start Date</b>
              </label>
            </div>
          </div>
          <div className="row">
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
            <div className="col-md-3">
              <DatePicker
                id="startDate"
                selected={this.state.startDate}
                value={this.state.startDate}
                onChange={this.handleDateChange}
              />
            </div>
            {btnLine}
          </div>
        </div>
      );
    }
    return details;
  }

  btns() {
    let btns = (
      <div className="col-md-2">
        <button
          type="button"
          className="btn btn-primary btn-sm cursor-pointer"
          id="generate"
          onClick={event => this.handleBtnClick(event)}
        >
          Generate
        </button>

        <p className="text-danger"> {this.state.msg}</p>
      </div>
    );
    return btns;
  }

  tradeList() {
    if (this.props.user) {
      return <div> {this.props.user.username} Trades</div>;
    } else {
      return <div> waiting api plans results</div>;
    }
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
          startDate: this.state.startDate
        },
        headers: { "x-auth": this.props.token }
      })
        .then(function(response) {
          if (response.data) {
            console.log("**RESPONSE", response.data);
            _this.setState({ trades: response.data });
          }
        })
        .catch(function(error) {
          console.log(error);
        });
    } catch (e) {
      console.log(e);
    }
  }

  handleOptionChange(changeEvent) {
    this.setState({
      symbol: changeEvent.target.value,
      msg: ""
    });
  }

  handleDateChange(changeEvent) {
    //date.toLocaleDateString("en-US")
    this.setState({
      startDate: changeEvent,
      msg: ""
    });
  }

  render() {
    let role = this.props.user ? this.props.user.role : false;
    let filter = this.showFilters();
    return (
      <div className="container">
        <Menu logged={role} />
        <div className="form-group">{filter}</div>
        <TradeList trades={this.state.trades} />
      </div>
    );
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
export default connect(mapStateToProps)(TradeReport);

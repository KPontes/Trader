import React, { Component } from "react";
import { connect } from "react-redux";
import { subscribeToArbitrage } from "../components/clientWebSocket";
import _ from "lodash";
import axios from "axios";

import Menu from "../components/menu";
import sysconfig from "../config";

class Arbitrage extends Component {
  constructor(props) {
    super(props);
    this.onInputChange = this.onInputChange.bind(this);
    this.state = {
      arbidata: [],
      maxUSD: 0
    };
    subscribeToArbitrage((err, data) =>
      this.setState({
        arbidata: data
      })
    );
  }

  detail() {
    if (!this.state.arbidata || !this.props.user) {
      return <div />;
    }
    let detail = this.state.arbidata.map((element, index) => {
      let tradeAmount = element.triangular[2].price * element.triangular[2].amount;
      let mkt1Earn = tradeAmount * element.bookDiff;
      let applyItem = (
        <div className="col-md-3 mt-2">
          <span
            className="btn-link text-secondary cursor-pointer"
            onClick={() => this.handleApplyClick(index)}
          >
            Apply
          </span>
        </div>
      );

      return (
        <div className="row ml-1" style={{ fontSize: "small" }}>
          <div className="col-md-1  mt-2 mb-2" align="left">
            {element.token} <br />
            {element.mkt1} <br />
            {element.mkt2} <br />
          </div>
          <div className="col-md-2 mt-2 mb-2" align="left">
            {element.triangular[0].symbol} <br />
            {element.triangular[0].description} <br />
            Price: {Number(element.triangular[0].price).toFixed(9)} <br />
            Qty: {_.round(element.triangular[0].amount, 4)} <br />
          </div>
          <div className="col-md-2 mt-2 mb-2" align="left">
            {element.triangular[1].symbol} <br />
            {element.triangular[1].description} <br />
            Price: {Number(element.triangular[1].price).toFixed(9)} <br />
            Qty: {_.round(element.triangular[1].amount, 4)} <br />
          </div>
          <div className="col-md-2  mt-2 mb-2" align="left">
            {element.triangular[2].symbol} <br />
            {element.triangular[2].description} <br />
            Price: {Number(element.triangular[2].price).toFixed(9)} <br />
            Qty: {_.round(element.triangular[2].amount, 4)} <br />
          </div>
          <div className="col-md-2 mt-2 mb-2" align="left">
            {_.round(element.bookDiff * 100, 4)} % <br />
            over {_.round(tradeAmount, 6)} {element.mkt1}
            <br />
            {element.mkt1} earn: {_.round(mkt1Earn, 6)}
          </div>
          {applyItem}
        </div>
      );
    });

    return detail;
  }

  title() {
    return (
      <span className="font-weight-bold">
        <div className="row">
          <div className="col-sm-4" align="left">
            Arbitrage Opportunities <small>(updates every 15s)</small>
          </div>
        </div>
        <div className="row ml-1">
          <div className="col-md-1" align="left">
            Tokens
          </div>
          <div className="col-md-2" align="left">
            Operation 01
          </div>
          <div className="col-md-2" align="left">
            Operation 02
          </div>
          <div className="col-md-2" align="left">
            Operation 03
          </div>
          <div className="col-md-2" align="left">
            Max earn expectation
          </div>
          <div className="col-md-3 form-inline input-group" align="left">
            Max apply USD value:
            <input
              type="text"
              className="form-control form-control-sm mb-4 ml-2 mr-2"
              id="maxUSD"
              placeholder="Value"
              value={this.state.maxUSD}
              onChange={this.onInputChange}
            />
          </div>
        </div>
      </span>
    );
  }

  handleApplyClick(index) {
    try {
      var _this = this;
      let item = this.state.arbidata[index];
      let data = {
        email: this.props.user.email,
        token: item.token,
        market1: item.mkt1,
        market2: item.mkt2,
        maxUsd: this.state.maxUSD,
        orderType: "LIMIT",
        oper1: {
          symbol: item.triangular[0].symbol,
          oper: item.triangular[0].oper
        },
        oper2: {
          symbol: item.triangular[1].symbol,
          oper: item.triangular[1].oper
        },
        oper3: {
          symbol: item.triangular[2].symbol,
          oper: item.triangular[2].oper
        }
      };
      axios({
        method: "post",
        baseURL: sysconfig.EXECUTER_URI,
        url: "/custom/command",
        data,
        headers: { "x-auth": this.props.token }
      })
        .then(function(response) {
          if (response.status === 200) {
            console.log("**APPLY RESPONSE", response.data);
          }
        })
        .catch(function(error) {
          console.log(error);
          alert("Error: " + error.response.data.message);
        });
    } catch (e) {
      console.log(e);
    }
  }

  onInputChange(event) {
    this.setState({
      [event.target.id]: event.target.value.trim()
    });
  }

  render() {
    let role = this.props.user ? this.props.user.role : false;
    let title = this.title();
    let detail = this.detail();
    return (
      <div className="container-fluid">
        <Menu logged={role} />
        <div className="bg-dark text-white">
          {title}
          {detail}
        </div>
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
export default connect(mapStateToProps)(Arbitrage);

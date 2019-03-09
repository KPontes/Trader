import React, { Component } from "react";
import { connect } from "react-redux";
import { subscribeToArbitrage } from "../components/clientWebSocket";
import _ from "lodash";

import Menu from "../components/menu";

class Arbitrage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      arbidata: []
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
      return (
        <div className="row ml-1" style={{ fontSize: "small" }}>
          <div className="col-md-1  mt-2 mb-2" align="left">
            {element.token} <br />
            {element.mkt1} <br />
            {element.mkt2} <br />
          </div>
          <div className="col-md-3 mt-2 mb-2" align="left">
            {element.triangular[0].symbol} <br />
            {element.triangular[0].description} <br />
            Price: {_.round(element.triangular[0].price, 9)} <br />
            Qty: {_.round(element.triangular[0].amount, 4)} <br />
          </div>
          <div className="col-md-3 mt-2 mb-2" align="left">
            {element.triangular[1].symbol} <br />
            {element.triangular[1].description} <br />
            Price: {_.round(element.triangular[1].price, 9)} <br />
            Qty: {_.round(element.triangular[1].amount, 4)} <br />
          </div>
          <div className="col-md-3  mt-2 mb-2" align="left">
            {element.triangular[2].symbol} <br />
            {element.triangular[2].description} <br />
            Price: {_.round(element.triangular[2].price, 9)} <br />
            Qty: {_.round(element.triangular[2].amount, 4)} <br />
          </div>
          <div className="col-md-2 mt-2 mb-2" align="left">
            {_.round(element.bookDiff * 100, 4)} % <br />
            over {_.round(tradeAmount, 6)} {element.mkt1}
            <br />
            {element.mkt1} earn: {_.round(mkt1Earn, 6)}
          </div>
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
          <div className="col-md-3" align="left">
            Operation 01
          </div>
          <div className="col-md-3" align="left">
            Operation 02
          </div>
          <div className="col-md-3" align="left">
            Operation 03
          </div>
          <div className="col-md-2" align="left">
            Max earn expectation
          </div>
        </div>
      </span>
    );
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

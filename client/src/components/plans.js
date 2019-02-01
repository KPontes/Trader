import React, { Component } from "react";
import axios from "axios";
import validator from "validator";

import sysconfig from "../config";

class Plans extends Component {
  constructor(props) {
    super(props);
    this.handleSendClick = this.handleSendClick.bind(this);
    this.state = {
      plans: [],
      settings: []
    };
  }

  async componentWillMount() {
    var _this = this;
    axios({
      method: "get",
      baseURL: sysconfig.EXECUTER_URI,
      url: "/getplans"
    })
      .then(function(response) {
        if (response.data) {
          _this.setState({ plans: response.data });
        }
      })
      .catch(function(error) {
        console.log(error);
      });
    axios({
      method: "get",
      baseURL: sysconfig.EXECUTER_URI,
      url: "/getsetting?exchange=binance"
    })
      .then(function(response) {
        if (response.data) {
          _this.setState({ settings: response.data });
        }
      })
      .catch(function(error) {
        console.log(error);
      });
  }

  getSettings() {
    if (!this.state.settings.exchange) {
      return <div> waiting api settings results</div>;
    } else {
      let setting = this.state.settings;
      let symbols = setting.symbols.map(element => {
        return "[" + element + "]  ";
      });
      let intervals = setting.periods.map(element => {
        return "[" + element + "]  ";
      });
      return (
        <div className="row">
          <div className="col-md-2">Exchange: {setting.exchange}</div>
          <div className="col-md-7">Tokens: {symbols}</div>
          <div className="col-md-3">Intervals: {intervals}</div>
        </div>
      );
    }
  }

  planList() {
    if (Array.isArray(this.state.plans) && this.state.plans.length > 0) {
      let listItems = this.state.plans.map(element => {
        return (
          <div className="col-md-3">
            <div className="card border-secondary mb-3" style={{ maxWidth: "18rem" }}>
              <div className="card-header">{element.name}</div>
              <div className="card-body">
                <h5 className="card-title">Max tokens: {element.maxSymbols}</h5>
                <p className="card-text">
                  {element.message}
                  <br />
                  <br />
                  Monthly: {Number(element.monthPrice).toFixed(2)}
                  <br />
                  Quarterly: {Number(element.quarterPrice).toFixed(2)}
                  <br />
                  Semiannual: {Number(element.halfPrice).toFixed(2)}
                  <br />
                  Annually: {Number(element.yearPrice).toFixed(2)}
                </p>
                <center>
                  <button
                    className="btn btn-outline-primary"
                    id={element.name}
                    onClick={event => this.handleSendClick()}
                  >
                    Purchase
                  </button>
                </center>
              </div>
            </div>
          </div>
        );
      });
      return listItems;
    } else {
      return <div> waiting api plans results</div>;
    }
  }

  handleSendClick(event) {
    try {
      if (!validator.isDecimal(this.state.price)) {
        throw new Error("Invalid price");
      }
    } catch (e) {
      console.log(e);
    }
  }

  render() {
    console.log("State", this.state);
    const setting = this.getSettings();
    console.log("setting", setting);
    const planList = this.planList();
    console.log("planList", planList);
    return (
      <div className="container-fluid">
        {setting}
        <hr />
        <div className="row">{planList}</div>
      </div>
    );
  }
}

export default Plans;

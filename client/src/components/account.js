import React, { Component } from "react";
import axios from "axios";
import validator from "validator";
import moment from "moment";

import sysconfig from "../config";
import Menu from "./menu";

class Account extends Component {
  constructor(props) {
    super(props);
    this.handleSendClick = this.handleSendClick.bind(this);
    this.state = {
      user: {}
    };
  }

  async componentWillMount() {
    var _this = this;
    axios({
      method: "get",
      baseURL: sysconfig.EXECUTER_URI,
      url: "/getuser?email=krishnanpontes@gmail.com"
    })
      .then(function(response) {
        if (response.data) {
          _this.setState({ user: response.data });
        }
      })
      .catch(function(error) {
        console.log(error);
      });
  }

  getUser() {
    if (!this.state.user.name) {
      return <div> waiting api user results</div>;
    } else {
      let user = this.state.user;
      // let intervals = setting.periods.map(element => {
      //   return "[" + element + "]  ";
      // });
      return (
        <div className="row bg-secondary text-white">
          <div className="col-md-2">User: {user.name}</div>
          <div className="col-md-3">E-mail: {user.email}</div>
          <div className="col-md-2">Validity: {moment(user.validtil).format("YYYY-MM-DD")}</div>
          <div className="col-md-2">Status: {user.status}</div>
        </div>
      );
    }
  }

  getDetails() {
    if (this.state.user.name) {
      let details = this.state.user.monitor.map(element => {
        return (
          <div>
            <div className="row font-weight-bold" align="center">
              <div className="col-md-1">Symbol</div>
              <div className="col-md-1">Strategy</div>
              <div className="col-md-2">Min interval</div>
              <div className="col-md-1">Max USD</div>
              <div className="col-md-2">Last Direction</div>
              <div className="col-md-2">Last Price</div>
              <div className="col-md-2">Action</div>
            </div>
            <div className="row" align="center">
              <div className="col-md-1">{element.symbol}</div>
              <div className="col-md-1">{element.strategy}</div>
              <div className="col-md-2">{element.period}</div>
              <div className="col-md-1">{element.maxAmount}</div>
              <div className="col-md-2">{element.lastDirection}</div>
              <div className="col-md-2">{element.lastPrice}</div>
              <div className="col-md-2">
                <button type="button" className="btn btn-outline-dark">
                  Configure
                </button>
              </div>
            </div>
          </div>
        );
      });
      return details;
      // let intervals = setting.periods.map(element => {
      //   return "[" + element + "]  ";
      // });
    }
  }

  setActions() {
    return (
      <div className="row">
        <div className="col-md-2">
          <button type="button" className="btn btn-primary">
            Start Trading
          </button>
        </div>
        <div className="col-md-2">
          <button type="button" className="btn btn-danger">
            Stop Trading
          </button>
        </div>
      </div>
    );
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
    const user = this.getUser();
    const detail = this.getDetails();
    const actions = this.setActions();
    return (
      <div className="container-fluid">
        <Menu logged={this.props.logged} />
        <hr />
        {user}
        <hr />
        {detail}
        <br />
        {actions}
      </div>
    );
  }
}

export default Account;

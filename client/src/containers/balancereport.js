import React, { Component } from "react";
import _ from "lodash";
import axios from "axios";
import { connect } from "react-redux";

import sysconfig from "../config";
import BalanceList from "../components/balancelist";

class BalanceReport extends Component {
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);
    this.handleSaveClick = this.handleSaveClick.bind(this);
    this.handleListClick = this.handleListClick.bind(this);
    this.getCurrBalance();
    this.state = {
      currBalance: undefined,
      balancelist: "hide",
      btnEnabled: true,
      msg: ""
    };
  }

  getCurrBalance() {
    var _this = this;
    axios({
      method: "post",
      baseURL: sysconfig.EXECUTER_URI,
      url: "/balance/get",
      data: {
        email: this.props.user.email
      },
      headers: { "x-auth": this.props.token }
    })
      .then(function(response) {
        if (response.status === 200) {
          _this.state.currBalance = response.data;
        }
      })
      .catch(function(error) {
        console.log(error);
        alert("Error: " + error.response.data.message);
      });
  }

  showBalance() {
    const listBalance = () => {
      if (this.state.currBalance) {
        return this.state.currBalance.map(element => {
          return (
            <div className="row">
              <div className="col-md-2">{element.asset}</div>
              <div className="col-md-2">{_.round(element.amount, 6)}</div>
              <div className="col-md-2">{_.round(element.USD, 2)}</div>
              <div className="col-md-2">{_.round(element.BTC, 4)}</div>
            </div>
          );
        });
      }
    };

    var lista = listBalance();
    let btnLine = this.btns();
    let title = this.title();
    let details;
    if (this.state.currBalance) {
      details = (
        <div>
          {title}
          {lista}
          {btnLine}
        </div>
      );
    }
    return details;
  }

  title() {
    return (
      <span>
        <div className="row">
          <div className="col-md-6">
            <label>
              <b>Current Balance</b>
            </label>
          </div>
        </div>
        <div className="row">
          <div className="col-md-2">
            <label>
              <b>Asset</b>
            </label>
          </div>
          <div className="col-md-2">
            <label>
              <b>Amount</b>
            </label>
          </div>
          <div className="col-md-2">
            <label>
              <b>USD Value</b>
            </label>
          </div>
          <div className="col-md-2">
            <label>
              <b>BTC Value</b>
            </label>
          </div>
        </div>
      </span>
    );
  }

  btns() {
    let btns = (
      <div className="row">
        <div className="col-md-2">
          <br />
          <button
            type="button"
            className="btn btn-primary btn-sm cursor-pointer"
            id="save"
            disabled={!this.state.btnEnabled}
            onClick={event => this.handleSaveClick(event)}
          >
            Save Balance Snapshot
          </button>

          <p className="text-danger"> {this.state.msg}</p>
        </div>
        <div className="col-md-2">
          <br />
          <button
            type="button"
            className="btn btn-primary btn-sm cursor-pointer"
            id="list"
            onClick={event => this.handleListClick(event)}
          >
            List Snapshots
          </button>
        </div>
      </div>
    );
    return btns;
  }

  handleSaveClick(event) {
    try {
      let _this = this;
      axios({
        method: "post",
        baseURL: sysconfig.EXECUTER_URI,
        url: "/balance/add",
        data: {
          email: this.props.user.email
        },
        headers: { "x-auth": this.props.token }
      })
        .then(function(response) {
          if (response.status === 200) {
            _this.setState({
              msg: "Saved",
              btnEnabled: false,
              balancelist: "hide"
            });
          }
        })
        .catch(function(error) {
          alert("Error: " + error.response.data.message);
          console.log(error);
        });
    } catch (e) {
      console.log(e);
    }
  }

  handleListClick(event) {
    try {
      let _this = this;
      axios({
        method: "post",
        baseURL: sysconfig.EXECUTER_URI,
        url: "/balance/list",
        data: {
          email: this.props.user.email
        },
        headers: { "x-auth": this.props.token }
      })
        .then(function(response) {
          if (response.status === 200) {
            _this.setState({
              balances: response.data,
              balancelist: "show"
            });
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

  getData(val) {
    //receive data from child component
    if (val === "hide") {
      this.setState({ balancelist: "hide", btnEnabled: true });
    }
  }

  render() {
    let panel = <div />;
    panel = this.showBalance();
    if (this.state.balancelist !== "hide") {
      panel = (
        <BalanceList
          sendData={this.getData}
          token={this.props.token}
          balances={this.state.balances}
        />
      );
    }
    return (
      <div className="container">
        <div className="form-group">{panel}</div>
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
export default connect(mapStateToProps)(BalanceReport);

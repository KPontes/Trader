import React, { Component } from "react";
import axios from "axios";
import moment from "moment";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { selectUser } from "../actions/root";
import sysconfig from "../config";

class User extends Component {
  constructor(props) {
    super(props);
    this.handleResendClick = this.handleResendClick.bind(this);
    this.handleBtnClick = this.handleBtnClick.bind(this);
    this.state = {
      msg: ""
    };
  }

  loadUser() {
    var _this = this;
    axios({
      method: "post",
      baseURL: sysconfig.EXECUTER_URI,
      url: "/user/getme",
      headers: { "x-auth": this.props.token }
    })
      .then(function(response) {
        if (response.status === 200) {
          _this.props.selectUser(response.data);
        }
      })
      .catch(function(error) {
        console.log("Err LoadUser", error);
      });
  }

  componentDidUpdate() {
    this.loadUser();
  }

  componentDidMount() {
    this.loadUser();
  }

  showUser() {
    if (!this.props.user || !this.props.user.comercial || !this.props.user.validtil) {
      return <div> waiting api user results</div>;
    } else {
      let user = this.props.user;
      let validate = <div />;
      if (user.status === "registered") {
        validate = (
          <div>
            <button
              type="button"
              className="btn btn-danger btn-sm ml-2"
              onClick={event => this.handleResendClick()}
            >
              Resend validation email
            </button>
            <br />
          </div>
        );
      }
      let validity = moment(user.validtil).format("YYYY-MM-DD");
      if (user.comercial.plan.toUpperCase() === "FREE") {
        validity = `up to ${user.comercial.tradesLimit} trades`;
      }
      return (
        <div className="container-fluid">
          <div className="row bg-secondary text-white">
            <div className="col-md-2">User: {user.username}</div>
            <div className="col-md-3">Email: {user.email}</div>
            <div className="col-md-3">Validity: {validity}</div>
            <div className="col-md-3">
              Account status: {user.status}
              {validate}
            </div>
          </div>
        </div>
      );
    }
  }

  setActions(enabled, verifyMsg) {
    let msgIn = verifyMsg === "OK" ? "" : verifyMsg;
    let msg;
    if (msgIn !== "") {
      msg = (
        <div className="text-danger" align="center">
          {msgIn}
        </div>
      );
    }

    let btn;
    if (this.props.user && this.props.user.status === "activeOn") {
      btn = (
        <div className="row">
          <div className="col-md-12" align="center">
            <button
              type="button"
              id="stop"
              className="btn btn-danger"
              align="center"
              disabled={!enabled}
              onClick={event => this.handleBtnClick(event)}
            >
              Stop Trading
            </button>
          </div>
        </div>
      );
    } else {
      btn = (
        <div className="row">
          <div className="col-md-12" align="center">
            <button
              type="button"
              id="start"
              className="btn btn-primary"
              align="center"
              disabled={!enabled}
              onClick={event => this.handleBtnClick(event)}
            >
              Start Trading
            </button>
          </div>
        </div>
      );
    }
    return [btn, msg];
  }

  handleBtnClick(e) {
    let action = e.target.id === "start" ? "start" : "stop";
    try {
      var _this = this;
      axios({
        method: "post",
        baseURL: sysconfig.EXECUTER_URI,
        url: "/user/startstop",
        data: { email: this.props.user.email, action },
        headers: { "x-auth": this.props.token }
      })
        .then(function(response) {
          if (response.status === 200) {
            _this.props.selectUser(response.data);
          }
        })
        .catch(err => {
          _this.setState({
            msg: `Status: ${err.response.status} Error: ${err.response.data.message}`
          });
          alert(`Status: ${err.response.status} Error: ${err.response.data.message}`);
        });
    } catch (e) {
      alert("Error: " + e);
    }
  }

  renderNoValidated(user) {
    return (
      <div className="container-fluid">
        <hr />
        {user}
        <br />
        <p className="text-center text-info">
          <b>{this.state.msg}</b>
        </p>
      </div>
    );
  }

  verifyUser() {
    let msg = "Waiting load user";
    if (this.props.user && this.props.user.email) {
      msg = "OK";
      if (this.props.user.monitor.length === 0) msg = "No Tokens configured";
      if (this.props.user.tk.length < 64 || this.props.user.sk.length < 64)
        msg = "No Security API Keys configured";
      if (this.props.user.status === "registered") msg = "User email not validated";
      if (this.props.user.validtil < new Date()) msg = "Plan validity expired";
      // if (msg !== "OK") {
      //   this.setState({ msg });
      // }
    }
    return msg;
  }

  render() {
    const verifyMsg = this.verifyUser();
    const user = this.showUser();
    if (this.props.user && this.props.user.status === "registered") {
      return this.renderNoValidated(user);
    }
    const actions = this.setActions(verifyMsg === "OK", verifyMsg);
    return (
      <div>
        {user}
        <br />
        {actions}
      </div>
    );
  }

  handleResendClick(event) {
    try {
      var _this = this;
      axios({
        method: "post",
        baseURL: sysconfig.EXECUTER_URI,
        url: "/user/resend",
        data: { userid: this.props.user._id },
        headers: { "x-auth": this.props.token }
      })
        .then(function(response) {
          if (response.status === 200) {
            _this.setState({ msg: "Please check your email" });
          }
        })
        .catch(function(error) {
          console.log(error);
          alert("Error: " + error.message);
        });
    } catch (e) {
      console.log(e);
    }
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
)(User);

import React, { Component } from "react";
import axios from "axios";
import validator from "validator";

import sysconfig from "../config";
import Menu from "./menu";

class Signup extends Component {
  constructor(props) {
    super(props);
    this.handleRegisterClick = this.handleRegisterClick.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.state = {
      username: "",
      email: "",
      password: "",
      verification: "",
      exchange: "binance",
      btnSubmit: "Submit",
      isBtnDisabled: false,
      msg: ""
    };
  }

  onInputChange(event) {
    this.setState({
      [event.target.id]: event.target.value.trim()
    });
  }

  handleRegisterClick(event) {
    try {
      if (!validator.isEmail(this.state.email)) {
        throw new Error("Invalid email");
      }
      if (this.state.username.length < 3) {
        throw new Error("Username must be at least 3 characters");
      }
      if (this.state.password.length < 8) {
        throw new Error("Password must be at least 8 digits");
      }
      if (this.state.password !== this.state.verification) {
        throw new Error("Password verification do not match");
      }
      this.setState({
        isBtnDisabled: true,
        btnSubmit: "Wait...",
        email: "",
        password: "",
        verification: ""
      });
      var _this = this;
      axios({
        method: "post",
        baseURL: sysconfig.EXECUTER_URI,
        url: "/user/add",
        data: {
          email: this.state.email,
          password: this.state.password,
          username: this.state.username,
          exchange: this.state.exchange
        }
      })
        .then(function(response) {
          _this.setState({
            btnSubmit: "Submit",
            isBtnDisabled: true,
            msg:
              "Account created. Please verify your email and click on confirmation link to activate!"
          });
        })
        .catch(function(error) {
          console.log(error);
          alert("Error: " + error.message);
          _this.setState({
            btnSubmit: "Submit",
            isBtnDisabled: false,
            msg: ""
          });
        });
    } catch (e) {
      console.log(e);
      alert("Error: " + e.message);
    }
  }

  handleOptionChange(changeEvent) {
    this.setState({
      exchange: changeEvent.target.value
    });
  }

  render() {
    return (
      <div>
        <Menu logged={false} />
        <hr />
        <form>
          <div className="container w-75 form-group">
            <div className="form-group">
              <label>Select your Exchange</label>
              <select className="form-control" id="exchange">
                <option value="binance" checked onChange={this.handleOptionChange}>
                  BINANCE
                </option>
              </select>
            </div>
            <div className="form-group">
              <label>Username</label>
              <input
                className="form-control"
                id="username"
                placeholder="Enter username"
                value={this.state.username}
                onChange={this.onInputChange}
              />
            </div>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                className="form-control"
                id="email"
                placeholder="Enter email"
                value={this.state.email}
                onChange={this.onInputChange}
              />
            </div>
            <div className="form-group">
              <label>Password </label>
              <small className="text-danger ml-2">
                (do NOT use the same password of your Exchange)
              </small>
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="Enter password"
                value={this.state.password}
                onChange={this.onInputChange}
              />
            </div>
            <div className="form-group">
              <label>Password Verificatiion</label>
              <input
                type="password"
                className="form-control"
                id="verification"
                placeholder="Enter password"
                value={this.state.verification}
                onChange={this.onInputChange}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary mr-4"
              disabled={this.state.isBtnDisabled}
              onClick={event => this.handleRegisterClick()}
            >
              {this.state.btnSubmit}
            </button>
            <div className="text-danger mt-2">{this.state.msg}</div>
          </div>
        </form>
      </div>
    );
  }
}

export default Signup;

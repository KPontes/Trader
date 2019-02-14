import React, { Component } from "react";
import axios from "axios";
import validator from "validator";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { selectToken } from "../actions/root";
import sysconfig from "../config";

class Login extends Component {
  constructor(props) {
    super(props);
    this.handleLoginClick = this.handleLoginClick.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.state = {
      user: {},
      email: "",
      password: "",
      btnLogin: "Login",
      btnRegister: "Register",
      isBtnDisabled: false
    };
  }

  onInputChange(event) {
    this.setState({
      [event.target.id]: event.target.value.trim()
    });
  }

  handleLoginClick(event) {
    try {
      //event.preventDefault();
      if (!validator.isEmail(this.state.email)) {
        throw new Error("Invalid email");
      }
      if (this.state.password.length < 8) {
        throw new Error("Password must be at least 8 digits");
      }
      this.setState({ isBtnDisabled: true, btnLogin: "Wait...", email: "", password: "" });
      var _this = this;
      axios({
        method: "post",
        baseURL: sysconfig.EXECUTER_URI,
        url: "/user/login",
        data: { email: this.state.email, password: this.state.password }
      })
        .then(function(response) {
          if (response.status === 200) {
            _this.props.selectToken(response.headers["x-auth"]);
          }
          _this.setState({
            btnLogin: "Login",
            isBtnDisabled: false
          });
        })
        .catch(function(error) {
          console.log(error);
          alert("Error: " + error.message);
          _this.setState({
            btnLogin: "Login",
            isBtnDisabled: false
          });
        });
    } catch (e) {
      alert("Error: " + e.message);
      console.log(e);
    }
  }

  render() {
    return (
      <form>
        <div className="container w-75 form-group">
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
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Enter password"
              value={this.state.password}
              onChange={this.onInputChange}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary mr-4"
            disabled={this.state.isBtnDisabled}
            onClick={event => this.handleLoginClick()}
          >
            {this.state.btnLogin}
          </button>
          <Link className="btn btn-secondary" to="/signup">
            Register
          </Link>
        </div>
      </form>
    );
  }
}

function mapStateToProps(state) {
  //whatever is returned will show as props inside this container
  return {
    token: state.activeToken
  };
}

//anything returned from this function will become props on this container
function mapDispatchToProps(dispatch) {
  //whenever selectToken is called, the result will be passed to all reducers
  return bindActionCreators({ selectToken: selectToken }, dispatch);
}

//promote Login from a component to a container with added props activeToken
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Login);

import React, { Component } from "react";
import axios from "axios";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { selectUser } from "../actions/root";
import sysconfig from "../config";

class Security extends Component {
  constructor(props) {
    super(props);
    this.handleBtnKeysClick = this.handleBtnKeysClick.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    this.state = {
      tk: "",
      sk: "",
      btnKeys: "Save Keys",
      tktype: "password",
      sktype: "password"
    };
  }

  onInputChange(event) {
    this.setState({
      [event.target.id]: event.target.value.trim()
    });
  }

  handleViewClick(event) {
    if (event.target.id === "btntk") {
      this.state.tktype === "password"
        ? this.setState({ tktype: "text" })
        : this.setState({ tktype: "password" });
    }
    if (event.target.id === "btnsk") {
      this.state.sktype === "password"
        ? this.setState({ sktype: "text" })
        : this.setState({ sktype: "password" });
    }
  }

  handleBtnKeysClick() {
    try {
      if (this.state.tk.length !== 64 || this.state.sk.length !== 64) {
        throw new Error("Invalid key, length must be 64.");
      }
      this.setState({ btnKeys: "Wait..." });
      var _this = this;
      axios({
        method: "POST",
        baseURL: sysconfig.EXECUTER_URI,
        url: "/user/tradekeys",
        headers: { "x-auth": this.props.token },
        data: { email: this.props.user.email, tk: this.state.tk, sk: this.state.sk }
      })
        .then(function(response) {
          if (response.status === 200) {
            _this.props.selectUser(response.data);
            _this.setState({ btnKeys: "Save Keys" });
            alert("Keys Saved");
          }
        })
        .catch(error => {
          _this.setState({ btnKeys: "Save Keys" });
          alert("Error: " + error.response.data);
        });
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  getKeys() {
    if (this.props.user) {
      return (
        <div className="container w-75 form-group">
          <label>Exchange API Keys</label>
          <div className="form-group">
            <label>Trade Key</label>
            <div className="row">
              <div className="col-md-10">
                <input
                  type={this.state.tktype}
                  className="form-control"
                  id="tk"
                  placeholder="trade key"
                  value={this.state.tk}
                  onChange={this.onInputChange}
                />
              </div>
              <div className="col-md-2">
                <img
                  id="btntk"
                  src="/images/eye1.png"
                  height="32"
                  width="45"
                  alt="toggle view"
                  className="cursor-pointer"
                  onClick={event => this.handleViewClick(event)}
                />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Secret Key</label>
            <div className="row">
              <div className="col-md-10">
                <input
                  type={this.state.sktype}
                  className="form-control"
                  id="sk"
                  placeholder="secret key"
                  value={this.state.sk}
                  onChange={this.onInputChange}
                />
              </div>
              <div className="col-md-2">
                <img
                  id="btnsk"
                  src="/images/eye1.png"
                  height="32"
                  width="45"
                  alt="toggle view"
                  className="cursor-pointer"
                  onClick={event => this.handleViewClick(event)}
                />
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary mr-3 mt-3"
            disabled={this.state.isBtnDisabled}
            onClick={event => this.handleBtnKeysClick()}
          >
            {this.state.btnKeys}
          </button>
        </div>
      );
    } else {
      return <div> waiting api user data</div>;
    }
  }

  render() {
    const keys = this.getKeys();
    return (
      <div>
        <div className="row">{keys}</div>
      </div>
    );
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
)(Security);

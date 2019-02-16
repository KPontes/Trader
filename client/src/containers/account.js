import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { selectUser } from "../actions/root";
import Menu from "../components/menu";
import Plans from "./plans";
import ExchangeSetting from "./exchangesetting";
import User from "./user";
import UserSymbol from "./usersymbol";
import Security from "./security";

class Account extends Component {
  constructor(props) {
    super(props);
    this.state = {
      msg: "",
      mxchange: false,
      mplan: false,
      mtoken: false,
      msecure: false
    };
  }

  sideMenu() {
    return (
      <div className="col-md-1 bg-dark text-white">
        <p>
          <font color="SpringGreen">Settings</font>
        </p>
        <span
          className="btn-link cursor-pointer text-white"
          onClick={() =>
            this.setState({ mxchange: true, mplan: false, mtoken: false, msecure: false })
          }
        >
          Exchange
        </span>
        <br />
        <span
          className="btn-link cursor-pointer text-white"
          onClick={() =>
            this.setState({ mxchange: false, mplan: true, mtoken: false, msecure: false })
          }
        >
          Plan
        </span>
        <br />
        <span
          className="btn-link cursor-pointer text-white"
          onClick={() =>
            this.setState({ mxchange: false, mplan: false, mtoken: false, msecure: true })
          }
        >
          Security
        </span>
        <br />
        <span
          className="btn-link cursor-pointer text-white"
          onClick={() =>
            this.setState({ mxchange: false, mplan: false, mtoken: true, msecure: false })
          }
        >
          Tokens
        </span>
      </div>
    );
  }

  render() {
    let role = this.props.user ? this.props.user.role : false;
    let showplan = this.state.mplan ? <Plans /> : <div />;
    let showtoken = this.state.mtoken ? <UserSymbol /> : <div />;
    let showsecure = this.state.msecure ? <Security /> : <div />;
    let showexchange = this.state.mxchange ? <ExchangeSetting /> : <div />;
    let sidemenu = this.sideMenu();
    let toRender = <div />;
    if (this.props.user && this.props.user.status !== "registered") {
      toRender = (
        <div className="row">
          {sidemenu}
          <div className="col-md-11">
            {showexchange}
            {showsecure}
            {showplan}
            {showtoken}
          </div>
        </div>
      );
    }
    return (
      <div className="container-fluid">
        <Menu logged={role} />
        <User />
        <hr />
        {toRender}
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
)(Account);

import React, { Component } from "react";
import { connect } from "react-redux";

import Account from "./account";
import Login from "./login";

class Home extends Component {
  render() {
    // var oper = this.props.match.params.oper;

    var display;
    if (this.props.token && this.props.token.length > 50) {
      display = <Account />;
    } else {
      display = <Login />;
    }
    return display;
  }
}

function mapStateToProps(state) {
  //whatever is returned will show as props inside this container
  return {
    token: state.activeToken,
    user: state.activeUser
  };
}

//promote Login from a component to a container with added props activeToken
export default connect(mapStateToProps)(Home);

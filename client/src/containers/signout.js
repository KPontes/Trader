import React, { Component } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { selectToken, selectUser } from "../actions/root";
import sysconfig from "../config";

class Signout extends Component {
  componentDidMount() {
    this.props.selectToken(null);
    this.props.selectUser(null);
    axios({
      method: "DELETE",
      baseURL: sysconfig.EXECUTER_URI,
      url: "/user/logout",
      headers: { "x-auth": this.props.token }
    })
      .then(function(response) {
        if (response.status === 200) {
          console.log("Logged out");
        }
      })
      .catch(function(error) {
        console.log(error);
      });
  }

  render() {
    return (
      <div className="text-center">
        <br />
        <div>
          <span className="mb-5 mt-10">Signed out</span>
        </div>
        <br />
        <div>
          <Link className="btn btn-outline-secondary mt-5" to="/">
            Go to login page
          </Link>
        </div>
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
  return bindActionCreators({ selectToken: selectToken, selectUser: selectUser }, dispatch);
}

//promote Login from a component to a container with added props activeToken
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Signout);

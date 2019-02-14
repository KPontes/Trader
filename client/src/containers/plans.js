import React, { Component } from "react";
import axios from "axios";
import validator from "validator";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";

import { selectUser } from "../actions/root";
import sysconfig from "../config";

class Plans extends Component {
  constructor(props) {
    super(props);
    this.handleSendClick = this.handleSendClick.bind(this);
    this.state = {
      plans: []
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
  }

  planList() {
    if (this.props.user && Array.isArray(this.state.plans) && this.state.plans.length > 0) {
      let listItems = this.state.plans.map(element => {
        let btnName =
          element.name.toUpperCase() === this.props.user.comercial.plan.toUpperCase()
            ? "Current"
            : "Select";
        return (
          <div className="col-md-6">
            <div className="card border-secondary mb-3">
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
                </p>
                <center>
                  <button
                    className="btn btn-outline-primary"
                    id={element.name}
                    onClick={event => this.handleSendClick()}
                  >
                    {btnName}
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
    const planList = this.planList();
    return (
      <div>
        <hr />
        <div className="row">{planList}</div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  //whatever is returned will show as props inside this container
  return {
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
)(Plans);

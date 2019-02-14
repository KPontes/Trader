import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import axios from "axios";

import sysconfig from "../config";
import { selectUser } from "../actions/root";
import SymbolPanel from "./symbolpanel";

class UserSymbol extends Component {
  constructor(props) {
    super(props);
    this.handleChangeClick = this.handleChangeClick.bind(this);
    this.getData = this.getData.bind(this);
    this.state = {
      symbolpanel: "hide"
    };
    var _this = this;
    axios({
      method: "get",
      baseURL: sysconfig.EXECUTER_URI,
      url: "/getsetting?exchange=binance"
    })
      .then(function(response) {
        if (response.data) {
          _this.setState({ settings: response.data });
        }
      })
      .catch(function(error) {
        console.log(error);
      });
  }

  handleChangeClick(e, i) {
    this.setState({ index: i, symbolpanel: "show" });
  }

  btns(element, index) {
    return (
      <div className="col-md-6" align="center">
        <button
          type="button"
          className="btn btn-outline-dark btn-sm cursor-pointer ml-2"
          id={element.symbol}
          onClick={event => this.handleChangeClick(event, index)}
        >
          Symbol
        </button>
        <button
          type="button"
          className="btn btn-outline-dark btn-sm cursor-pointer ml-2"
          id={element.symbol}
          onClick={event => this.handleChangeClick(event, index)}
        >
          Numbers
        </button>
        <button
          type="button"
          className="btn btn-outline-dark btn-sm cursor-pointer ml-2"
          id={element.symbol}
          onClick={event => this.handleChangeClick(event, index)}
        >
          Algorithms
        </button>
      </div>
    );
  }

  getUserSymbols() {
    if (this.props.user) {
      var indx = 0;
      let btnLine;
      let listItems = [];
      for (let element of this.props.user.monitor) {
        btnLine = this.btns(element, indx);
        listItems.push(
          <div>
            <div className="row bg-light" align="center">
              <div className="col-md-1">{element.symbol}</div>
              <div className="col-md-1">{element.strategy}</div>
              <div className="col-md-2">{element.period}</div>
              <div className="col-md-2">
                {element.maxAmount.value} {element.maxAmount.selector}
              </div>
              {btnLine}
            </div>
          </div>
        );
        indx += 1;
      }
      return listItems;
    }
  }

  getData(val) {
    //receive data from child component
    this.setState({
      symbolpanel: val
    });
  }

  render() {
    const monitor = this.getUserSymbols();
    let panel =
      this.state.symbolpanel === "hide" ? (
        <div />
      ) : (
        <SymbolPanel sendData={this.getData} index={this.state.index} />
      );
    return (
      <div>
        <div className="row bg-light font-weight-bold" align="center">
          <div className="col-md-1">Symbol</div>
          <div className="col-md-1">Strategy</div>
          <div className="col-md-2">Min interval</div>
          <div className="col-md-2">Max Amount</div>
          <div className="col-md-6">Actions</div>
        </div>
        <div>{monitor}</div>
        <div>{panel}</div>
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
)(UserSymbol);

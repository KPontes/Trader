import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import axios from "axios";
import ReactTooltip from "react-tooltip";

import sysconfig from "../config";
import { selectUser } from "../actions/root";
import SymbolPanel from "./symbolpanel";
import NumberPanel from "./numberpanel";
import AlgoPanel from "./algopanel";

class UserSymbol extends Component {
  constructor(props) {
    super(props);
    this.handleChangeClick = this.handleChangeClick.bind(this);
    this.getData = this.getData.bind(this);
    this.state = {
      symbolpanel: "hide",
      numberpanel: "hide",
      algopanel: "hide"
    };
    var _this = this;
    axios({
      method: "get",
      baseURL: sysconfig.EXECUTER_URI,
      url: "/getsetting?exchange=" + this.props.user.exchange
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
    if (e.target.value === "symbol") {
      this.setState({ index: i, symbolpanel: "show", numberpanel: "hide", algopanel: "hide" });
    }
    if (e.target.value === "number") {
      this.setState({ index: i, symbolpanel: "hide", numberpanel: "show", algopanel: "hide" });
    }
    if (e.target.value === "algo") {
      this.setState({ index: i, symbolpanel: "hide", numberpanel: "hide", algopanel: "show" });
    }
    if (e.target.value === "mode") {
      this.changeMode(i);
    }
  }

  changeMode(index) {
    var _this = this;
    axios({
      method: "patch",
      baseURL: sysconfig.EXECUTER_URI,
      url: "/user/mode",
      data: {
        email: this.props.user.email,
        index
      },
      headers: { "x-auth": this.props.token }
    })
      .then(function(response) {
        if (response.status === 200) {
          _this.props.selectUser(response.data);
        }
      })
      .catch(function(error) {
        console.log(error);
        alert("Error: " + error.response.data.message);
      });
  }

  btns(element, index) {
    return (
      <div className="col-md-6" align="center">
        <button
          type="button"
          className="btn btn-outline-dark btn-sm cursor-pointer ml-2"
          id={element.symbol}
          value="symbol"
          disabled={this.props.user.status === "activeOn"}
          onClick={event => this.handleChangeClick(event, index)}
        >
          Symbol
        </button>
        <button
          type="button"
          className="btn btn-outline-dark btn-sm cursor-pointer ml-2"
          id={element.symbol}
          value="number"
          disabled={this.props.user.status === "activeOn"}
          onClick={event => this.handleChangeClick(event, index)}
        >
          Numbers
        </button>
        <button
          type="button"
          className="btn btn-outline-dark btn-sm cursor-pointer ml-2"
          id={element.symbol}
          value="algo"
          disabled={this.props.user.status === "activeOn"}
          onClick={event => this.handleChangeClick(event, index)}
        >
          Algorithms
        </button>
      </div>
    );
  }

  btnMode(element, indx) {
    return (
      <button
        className="btn btn-light btn-sm cursor-pointer"
        id={element.symbol}
        value="mode"
        onClick={event => this.handleChangeClick(event, indx)}
      >
        {element.mode.toUpperCase()}
      </button>
    );
  }

  getUserSymbols() {
    if (this.props.user) {
      let indx = 0;
      let btnLine;
      let mode;
      let listItems = [];
      for (let element of this.props.user.monitor) {
        btnLine = this.btns(element, indx);
        mode = this.btnMode(element, indx);
        listItems.push(
          <div>
            <div className="row bg-light" align="center">
              <div className="col-md-2">{element.symbol}</div>
              <div className="col-md-2">{element.strategy}</div>
              <div className="col-md-2">{mode}</div>
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
    if (val === "hide-symbol-panel")
      this.setState({
        symbolpanel: "hide"
      });
    if (val === "hide-number-panel")
      this.setState({
        numberpanel: "hide"
      });
    if (val === "hide-algo-panel")
      this.setState({
        algopanel: "hide"
      });
  }

  render() {
    const monitor = this.getUserSymbols();
    const settings = this.state.settings;
    const index = this.state.index;
    let panel;
    if (
      this.state.symbolpanel === "hide" &&
      this.state.numberpanel === "hide" &&
      this.state.algopanel === "hide"
    ) {
      panel = <div />;
    }
    if (this.state.symbolpanel === "show") {
      panel = <SymbolPanel sendData={this.getData} settings={settings} index={index} />;
    }
    if (this.state.numberpanel === "show") {
      panel = <NumberPanel sendData={this.getData} settings={settings} index={index} />;
    }
    if (this.state.algopanel === "show") {
      panel = <AlgoPanel sendData={this.getData} settings={settings} index={index} />;
    }
    return (
      <div>
        <div className="row bg-light font-weight-bold" align="center">
          <div className="col-md-2">Symbol</div>
          <div className="col-md-2">Strategy</div>
          <div className="col-md-2">Mode</div>
          <div className="col-md-6">
            <label data-tip="Stop trade to enable actions configuring">Actions</label>
          </div>
          <ReactTooltip place="top" type="info" effect="float" />
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

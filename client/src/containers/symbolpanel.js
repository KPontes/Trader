import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import axios from "axios";

import sysconfig from "../config";
import { selectUser } from "../actions/root";

class SymbolPanel extends Component {
  constructor(props) {
    super(props);
    this.handleChangeClick = this.handleChangeClick.bind(this);
    this.handleDelClick = this.handleDelClick.bind(this);
    this.handleAddClick = this.handleAddClick.bind(this);
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
    let index = this.props.index;
    let symbol = this.props.user.monitor[index].symbol;
    this.state = {
      showdetail: false,
      oldSymbol: symbol,
      newSymbol: symbol,
      msg: ""
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
    try {
      if (this.state.oldSymbol === this.state.newSymbol) {
        throw new Error("Same symbol.");
      }
      var _this = this;
      axios({
        method: "post",
        baseURL: sysconfig.EXECUTER_URI,
        url: "/usersymbol/changesymbol",
        data: {
          email: this.props.user.email,
          oldsymbol: this.state.oldSymbol,
          newsymbol: this.state.newSymbol
        },
        headers: { "x-auth": this.props.token }
      })
        .then(function(response) {
          if (response.status === 200) {
            _this.props.selectUser(response.data);
            _this.state.msg = "Symbol changed!";
          }
        })
        .catch(function(error) {
          console.log(error);
          alert("Error: " + error.message);
        });
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  handleAddClick(e, i) {
    try {
      if (this.state.oldSymbol === this.state.newSymbol) {
        throw new Error("Same symbol.");
      }
      var _this = this;
      axios({
        method: "post",
        baseURL: sysconfig.EXECUTER_URI,
        url: "/usersymbol/add",
        data: {
          email: this.props.user.email,
          usedefault: true,
          symbol: this.state.newSymbol
        },
        headers: { "x-auth": this.props.token }
      })
        .then(function(response) {
          if (response.status === 200) {
            _this.props.selectUser(response.data);
            _this.state.msg = "Symbol added!";
          }
        })
        .catch(function(error) {
          console.log(error);
          alert("Error: " + error.message);
        });
    } catch (e) {
      alert("Error: " + e.message);
    }
  }

  handleDelClick(e, i) {
    console.log("DEL Clicked");
  }

  handleOptionChange(changeEvent) {
    this.setState({
      newSymbol: changeEvent.target.value,
      msg: ""
    });
  }

  handleCloseClick(changeEvent) {
    this.props.sendData("hide"); //send to parent
  }

  btns() {
    return (
      <div>
        <div className="col-md-5">
          <button
            type="button"
            className="btn btn-info btn-sm cursor-pointer"
            id={this.state.newSymbol}
            onClick={event => this.handleChangeClick(event)}
          >
            Change
          </button>
          <button
            type="button"
            className="btn btn-info btn-sm cursor-pointer ml-2"
            id={this.state.newSymbol}
            onClick={event => this.handleAddClick(event)}
          >
            Add
          </button>
          <button
            type="button"
            className="btn btn-info btn-sm cursor-pointer ml-2"
            id={this.state.newSymbol}
            onClick={event => this.handleDelClick(event)}
          >
            Delete
          </button>
          <p className="text-danger"> {this.state.msg}</p>
        </div>
        <div className="col-md-1" align="right">
          <button
            type="button"
            className="close"
            aria-label="Close"
            onClick={event => this.handleCloseClick(event)}
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </div>
    );
  }

  getUserSymbols(index) {
    const opts = () => {
      if (this.state.settings) {
        return this.state.settings.symbols.map(element => {
          return (
            <option id={element} value={element}>
              {element}
            </option>
          );
        });
      }
    };

    var lista = opts();
    let btnLine = this.btns();
    let details;
    if (this.props.user) {
      details = (
        <div>
          <div className="row">
            <div className="col-md-3">
              <label>Select your new Symbol Pair</label>
            </div>
          </div>
          <div className="row">
            <div className="col-md-3">
              <select
                className="form-control"
                id="exchange"
                value={this.state.newSymbol}
                onChange={this.handleOptionChange}
              >
                {lista}
              </select>
            </div>
            {btnLine}
          </div>
        </div>
      );
    }
    return details;
  }

  render() {
    let panelSymbol = <div />;
    // if (this.props.field === "symbol") {
    panelSymbol = this.getUserSymbols(this.state.index);
    //}
    return (
      <div className="presentation-div">
        <div className="form-group">{panelSymbol}</div>
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
)(SymbolPanel);

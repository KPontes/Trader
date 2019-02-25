import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import axios from "axios";
import validator from "validator";
import ReactTooltip from "react-tooltip";

import sysconfig from "../config";
import { selectUser } from "../actions/root";

class NumberPanel extends Component {
  constructor(props) {
    super(props);
    this.handleChangeClick = this.handleChangeClick.bind(this);
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
    let index = this.props.index;
    let symbol = this.props.user.monitor[index].symbol;
    let maxSelector = this.props.user.monitor[index].maxAmount.selector;
    let maxValue = this.props.user.monitor[index].maxAmount.value;
    let topVariation = this.props.user.monitor[index].stopLoss.topVariation * 100;
    let bottomVariation = this.props.user.monitor[index].stopLoss.bottomVariation * 100;
    this.state = {
      showdetail: false,
      msg: "",
      symbol,
      maxSelector,
      maxValue,
      topVariation,
      bottomVariation
    };
  }

  handleChangeClick(e, i) {
    try {
      if (
        !validator.isNumeric(this.state.topVariation) ||
        !validator.isNumeric(this.state.bottomVariation) ||
        !validator.isNumeric(this.state.maxValue)
      ) {
        throw new Error("Invalid email");
      }
      var _this = this;
      axios({
        method: "patch",
        baseURL: sysconfig.EXECUTER_URI,
        url: "/usersymbol/numbers",
        data: {
          email: this.props.user.email,
          symbol: this.state.symbol,
          maxSelector: this.state.maxSelector,
          maxValue: this.state.maxValue,
          topVariation: this.state.topVariation / 100,
          bottomVariation: this.state.bottomVariation / 100
        },
        headers: { "x-auth": this.props.token }
      })
        .then(function(response) {
          if (response.status === 200) {
            _this.props.selectUser(response.data);
            _this.state.msg = "Numbers configured!";
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

  handleOptionChange(changeEvent) {
    if (changeEvent.target.name === "maxSelector") {
      this.setState({ [changeEvent.target.name]: changeEvent.target.value, msg: "" });
    } else {
      this.setState({ [changeEvent.target.id]: changeEvent.target.value, msg: "" });
    }
  }

  handleCloseClick(changeEvent) {
    this.props.sendData("hide-number-panel"); //send to parent
  }

  btns() {
    let btns = (
      <div className="col-md-5" align="left>">
        <br />
        <button
          type="button"
          className="btn btn-info btn-sm cursor-pointer"
          id="update"
          onClick={event => this.handleChangeClick(event)}
        >
          Update
        </button>
        <p className="text-danger"> {this.state.msg}</p>
      </div>
    );
    return btns;
  }

  titles() {
    let title = (
      <div className="row font-weight-bold">
        <div className="col-md-2">Low Interval</div>
        <div className="col-md-2">High Interval</div>
        <div className="col-md-2">Trade Schedule %</div>
        <div className="col-md-2">
          <label data-tip="Maximum allowed trade for this token, <br/> as % of your total account or USD">
            Max Amount
          </label>
        </div>
        <div className="col-md-2">
          <label data-tip="Sell on drop this % from top-price since last trading operation">
            Stop loss %
          </label>
        </div>
        <div className="col-md-2">
          <label data-tip="Buy on raise this % from bottom-price since last trading operation">
            Start Gain %
          </label>
        </div>
        <ReactTooltip place="top" type="dark" multiline="true" effect="float" />
      </div>
    );
    return title;
  }

  numbersDetail() {
    let index = this.props.index;
    const opts = value => {
      if (this.props.settings) {
        return this.props.settings.periods.map(element => {
          let checked = element === value ? "true" : "";
          return (
            <span className="col-md-2 ml-2">
              <input
                className="form-check-input"
                type="checkbox"
                value={element}
                disabled
                id={element}
                name={element}
                checked={checked}
              />
              <label className="form-check-label">{element}</label>
              <br />
            </span>
          );
        });
      }
    };
    let shortInterval = opts(this.props.user.monitor[index].period);
    let largeInterval = opts(this.props.user.monitor[index].largeInterval);
    let detail = (
      <div className="row">
        <div className="col-md-2">{shortInterval}</div>
        <div className="col-md-2">{largeInterval}</div>
        <div className="col-md-2" align="left">
          <input
            type="text"
            className="form-control"
            id="schedule"
            placeholder="trade schedule %"
            disabled
            value={this.props.user.monitor[index].schedule}
            onChange={this.onInputChange}
          />
        </div>
        <div className="col-md-2" align="left">
          <div className="form-check" align="left">
            <input
              className="form-check-input"
              name="maxSelector"
              id="maxPercent"
              type="radio"
              value="PERCENT"
              checked={this.state.maxSelector === "PERCENT"}
              onChange={this.handleOptionChange}
            />
            <label className="form-check-label">PERCENT</label>
          </div>
          <div className="form-check" align="left">
            <input
              className="form-check-input"
              name="maxSelector"
              id="maxUsd"
              type="radio"
              value="USD"
              checked={this.state.maxSelector === "USD"}
              onChange={this.handleOptionChange}
            />
            <label className="form-check-label">USD</label>
          </div>
          <div className="form-check" align="left">
            <input
              className="form-check-input"
              name="maxSelector"
              id="maxBtc"
              type="radio"
              value="BTC"
              disabled
              checked={this.state.maxSelector === "BTC"}
              onChange={this.handleOptionChange}
            />
            <label className="form-check-label">BTC</label>
          </div>
          <input
            type="text"
            className="form-control"
            id="maxValue"
            placeholder="Value"
            value={this.state.maxValue}
            onChange={this.onInputChange}
          />
        </div>
        <div className="col-md-2" align="left">
          <input
            type="text"
            className="form-control"
            id="topVariation"
            placeholder="stop loss (%)"
            value={this.state.topVariation}
            onChange={this.onInputChange}
          />
        </div>
        <div className="col-md-2" align="left">
          <input
            type="text"
            className="form-control"
            id="bottomVariation"
            placeholder="start gain (%)"
            value={this.state.bottomVariation}
            onChange={this.onInputChange}
          />
        </div>
      </div>
    );
    return detail;
  }

  displayUserNumbers() {
    let index = this.props.index;
    let btnLine = this.btns();
    let titleLine = this.titles();
    let detail = this.numbersDetail();
    let panel;
    if (this.props.user) {
      panel = (
        <div>
          <div className="row">
            <div className="col-md-6">
              <label>
                <b>{this.props.user.monitor[index].symbol} Numbers Configuration Panel</b>
              </label>
            </div>
            <div className="col-md-6" align="right">
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
          {titleLine}
          {detail}
          {btnLine}
        </div>
      );
    }
    return panel;
  }

  render() {
    let panel = <div />;
    panel = this.displayUserNumbers();
    return (
      <form>
        <div className="form-group presentation-div">{panel}</div>
      </form>
    );
  }

  onInputChange(event) {
    this.setState({
      [event.target.id]: event.target.value.trim()
    });
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
)(NumberPanel);

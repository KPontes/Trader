import React, { Component } from "react";
import axios from "axios";
import validator from "validator";

import sysconfig from "../config";

class ExchangeSetting extends Component {
  constructor(props) {
    super(props);
    this.handleSendClick = this.handleSendClick.bind(this);
    this.state = {
      settings: []
    };
  }

  async componentWillMount() {
    var _this = this;
    axios({
      method: "get",
      baseURL: sysconfig.EXECUTER_URI,
      url: "/getsetting?exchange=" + _this.props.exchange
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

  getSettings() {
    if (!this.state.settings.exchange) {
      return <div> waiting api settings results</div>;
    } else {
      let setting = this.state.settings;
      let symbols = setting.symbols.map(element => {
        return "[" + element + "]  ";
      });
      let intervals = setting.periods.map(element => {
        return "[" + element + "]  ";
      });
      return (
        <div className="bg-light">
          <div className="row font-weight-bold">
            <div className="col-md-2">Exchange</div>
            <div className="col-md-7">Tokens</div>
            <div className="col-md-3">Intervals</div>
          </div>
          <div className="row">
            <div className="col-md-2"> {setting.exchange.toUpperCase()}</div>
            <div className="col-md-7"> {symbols}</div>
            <div className="col-md-3"> {intervals}</div>
          </div>
        </div>
      );
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
    const setting = this.getSettings();
    return <div>{setting}</div>;
  }
}

export default ExchangeSetting;

import React, { Component } from "react";

class AlgoEMA extends Component {
  panel() {
    let userPair = this.props.user.monitor[this.props.index];
    let cfg = (
      <span>
        <div className="row">
          <div className="col-md-12">
            <h5> Exponential Moving Average</h5>
          </div>
        </div>
        <div className="row">
          <div className="col-md-4">
            <p>
              <b>Calculation Parameters</b>
            </p>
            Short line: {userPair.configcalc.macd[0]}
            <br />
            Medium line: {userPair.configcalc.macd[1]}
          </div>
          <div className="col-md-8">
            <p>
              <b>Business Rules </b>
            </p>
            Buy when short line above medium.
            <br />
            Sell when short line bellow medium.
            <br />
            Used for MACD calculation.
          </div>
        </div>
      </span>
    );
    return cfg;
  }

  render() {
    let panel = this.panel();
    return <span>{panel}</span>;
  }
}

export default AlgoEMA;

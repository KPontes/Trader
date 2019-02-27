import React, { Component } from "react";

class AlgoRSI extends Component {
  panel() {
    let userPair = this.props.user.monitor[this.props.index];
    let cfg = (
      <span>
        <div className="row">
          <div className="col-md-12">
            <h5> Relative Strength Index</h5>
          </div>
        </div>
        <div className="row">
          <div className="col-md-4">
            <p>
              <b>Calculation Parameters</b>
            </p>
            Base number of periods: {userPair.configcalc.rsi[0]}
          </div>
          <div className="col-md-8">
            <p>
              <b>Business Rules </b>
            </p>
            Overbought signal top line: {userPair.configrule.rsi[1]}
            <br />
            Oversold signal bottom line: {userPair.configrule.rsi[0]}
            <br />
            Recent periods: {userPair.configrule.rsi[2]}
            <br />
            Recent periods gains and losses used to determine continuity or reversal of trend
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

export default AlgoRSI;

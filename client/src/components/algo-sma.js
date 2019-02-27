import React, { Component } from "react";

class AlgoSMA extends Component {
  panel() {
    let userPair = this.props.user.monitor[this.props.index];
    let cfg = (
      <span>
        <div className="row">
          <div className="col-md-12">
            <h5> Simple Moving Average</h5>
          </div>
        </div>
        <div className="row">
          <div className="col-md-4">
            <p>
              <b>Calculation Parameters</b>
            </p>
            x-Short line: {userPair.configcalc.sma[0]}
            <br />
            Short line: {userPair.configcalc.sma[1]}
            <br />
            Medium line: {userPair.configcalc.sma[2]}
            <br />
            Long line: {userPair.configcalc.sma[3]}
          </div>
          <div className="col-md-8">
            <p>
              <b>Business Rules </b>
            </p>
            Buy when short line above medium and medium above long.
            <br />
            Sell when short line bellow medium and medium bellow long.
            <br />
            Consider if last 3 averages of x-Short are indicating up or down trend.
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

export default AlgoSMA;

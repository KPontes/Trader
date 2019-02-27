import React, { Component } from "react";

class AlgoMACD extends Component {
  panel() {
    let userPair = this.props.user.monitor[this.props.index];
    let cfg = (
      <span>
        <div className="row">
          <div className="col-md-12">
            <h5> Moving Average Convergence Divergence</h5>
          </div>
        </div>
        <div className="row">
          <div className="col-md-5">
            <p>
              <b>Calculation Parameters</b>
            </p>
            Short line: {userPair.configcalc.macd[0]}
            <br />
            Long line: {userPair.configcalc.macd[1]}
            <br />
            Signal line: {userPair.configcalc.macd[2]}
          </div>
          <div className="col-md-7">
            <p>
              <b>Business Rules </b>
            </p>
            Buy signals:
            <ul className="list-none">
              <li>MACD Line greater than Signal </li>
              <li> MACD Line greater than 0 </li> <li> Short greater than Long</li>
            </ul>
            Sell signals:
            <ul className="list-none">
              <li>MACD Line less than Signal </li>
              <li> MACD Line less than 0 </li> <li> Short less than Long</li>
            </ul>
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

export default AlgoMACD;

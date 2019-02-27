import React, { Component } from "react";

class AlgoKLines extends Component {
  panel() {
    let userPair = this.props.user.monitor[this.props.index];
    let cfg = (
      <span>
        <div className="row">
          <div className="col-md-12">
            <h5> Candle Analysis</h5>
          </div>
        </div>
        <div className="row">
          <div className="col-md-5">
            <p>
              <b>Calculation Parameters</b>
            </p>
            Load last 500 candle sticks for configured interval
          </div>
          <div className="col-md-7">
            <p>
              <b>Business Rules </b>
            </p>
            Minimum variation: {userPair.configrule.klines[0] * 100} %
            <br />
            Group of 4 candles.
            <br />
            Variation rules: close minus open of last candle or last Group is greater than min
            variation.
            <br />
            Direction rules: Same direction (up or down) to all candles of the Group, denoting
            trend.
            <br />
            Trend inversion rules: All candles of last two Groups have same direction (up or down),
            except for the last candle.
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

export default AlgoKLines;

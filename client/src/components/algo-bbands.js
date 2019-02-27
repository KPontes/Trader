import React, { Component } from "react";

class AlgoBBands extends Component {
  panel() {
    let userPair = this.props.user.monitor[this.props.index];
    let cfg = (
      <span>
        <div className="row">
          <div className="col-md-12">
            <h5> Borllinger Bands</h5>
          </div>
        </div>
        <div className="row">
          <div className="col-md-5">
            <p>
              <b>Calculation Parameters</b>
            </p>
            Middle band: {userPair.configcalc.bbands[0]} days SMA
            <br />
            Upper band: Middle plus {userPair.configcalc.bbands[0]} days standard deviation x 2
            <br />
            Lower band: Middle minus {userPair.configcalc.bbands[0]} days standard deviation x 2
          </div>
          <div className="col-md-7">
            <p>
              <b>Business Rules </b>
            </p>
            Overbought signal: candle close above upperband
            <br />
            Oversold signal: candle close bellow lowerband
            <br />
            Recent periods: {userPair.configrule.bbands[0]}
            <br />
            Recent periods count of overbought or oversold signals used to determine on trend
            "walking the band", or reversal of trend.
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

export default AlgoBBands;

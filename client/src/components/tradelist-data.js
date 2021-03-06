import React, { Component } from "react";
import _ from "lodash";
import moment from "moment";

import Paginator from "./paginator";

class TradeList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      msg: "",
      updated: false
    };
  }

  componentDidUpdate() {
    if (this.props.trades[0] && !this.state.updated) {
      let market = this.props.trades[0].symbol.slice(-4) === "USDT" ? "USDT" : "BTC";
      let len = this.props.trades[0].symbol.length;
      let token = this.props.trades[0].symbol.substr(0, len - market.length);
      this.setState({ token, market, updated: true });
    }
  }

  title() {
    return [
      { title: "Operation", prop: "operation" },
      { title: "Rate", prop: "rate" },
      { title: this.state.token, prop: "token" },
      { title: this.state.market, prop: "market" },
      { title: "Diff", prop: "diff" },
      { title: "Percentage", prop: "percent" },
      { title: "Date", prop: "date" }
    ];
    // return (
    //   <div className="bg-light font-weight-bold">
    //     <div className="row">
    //       <div className="col-md-6"> Trade List</div>
    //     </div>
    //     <div className="row" align="right">
    //       <div className="col-md-1" align="center">
    //         {" "}
    //         Operation
    //       </div>
    //       <div className="col-md-1"> Rate</div>
    //       <div className="col-md-2"> {this.state.token}</div>
    //       <div className="col-md-2"> {this.state.market}</div>
    //       <div className="col-md-1"> Diff</div>
    //       <div className="col-md-1"> %</div>
    //     </div>
    //   </div>
    // );
  }

  List() {
    let listItems = [];
    let ind = 0;
    let totPercent = 0;
    for (let element of this.props.trades) {
      let tokenAmount;
      let marketAmount;
      if (element.side === "sell") {
        tokenAmount = element.quantity;
        marketAmount = element.quantity * element.price;
      } else {
        marketAmount = element.quantity;
        tokenAmount = element.quantity / element.price;
      }
      let diff;
      let percent;
      if (ind === 0) {
        diff = 0;
      } else {
        if (element.side.toLowerCase() === "buy") {
          diff = this.props.trades[ind - 1].price - element.price;
        } else {
          diff = element.price - this.props.trades[ind - 1].price;
        }
        percent = (diff * 100) / this.props.trades[ind - 1].price;
      }
      let color = diff >= 0 ? "text-primary" : "text-danger";
      if (!isNaN(percent)) {
        totPercent += percent;
      }
      listItems.push({
        operation: element.side,
        rate: _.round(element.price, 4),
        token: _.round(tokenAmount, 4),
        market: _.round(marketAmount, 2),
        diff: _.round(diff, 4),
        percent: _.round(percent, 2),
        date: moment(element.createdAt).format("YYYY-MM-DD hh:mm")
      });
      ind += 1;
    }
    let footer = (
      <div className="row">
        <div className="col-md-1" aligh="center">
          Accumulated
        </div>
        <div className="col-md-6" />
        <div className="col-md-1" align="right">
          {_.round(totPercent, 2)}
        </div>
      </div>
    );

    return [listItems, footer];
  }

  render() {
    if (!this.state || !this.state.token) {
      return <div />;
    }
    let title = this.title();
    let [detail, footer] = this.List();
    return (
      <div>
        <Paginator data={detail} columns={title} />
      </div>
    );
  }
}

export default TradeList;

// listItems.push(
//   <div className="bg-light" align="right">
//     <div className="row">
//       <div className="col-md-1" align="center">
//         {" "}
//         {element.side}
//       </div>
//       <div className="col-md-1"> {_.round(element.price, 4)}</div>
//       <div className="col-md-2"> {_.round(tokenAmount, 4)}</div>
//       <div className="col-md-2"> {_.round(marketAmount, 2)}</div>
//       <div className="col-md-1">
//         <label className={color}>{_.round(diff, 4)}</label>
//       </div>
//       <div className="col-md-1">
//         <label className={color}>{_.round(percent, 2)}</label>
//       </div>
//     </div>
//   </div>
// );

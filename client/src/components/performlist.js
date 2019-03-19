import React, { Component } from "react";
import _ from "lodash";
import moment from "moment";

class PerformList extends Component {
  constructor(props) {
    super(props);
    this.handleCloseClick = this.handleCloseClick.bind(this);
  }

  handleCloseClick(changeEvent) {
    this.props.sendData("hide"); //send to parent
  }

  title() {
    return (
      <div className="bg-light font-weight-bold">
        <div className="row">
          <div className="col-md-6"> Performance Summary</div>
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
      </div>
    );
  }

  summarize() {
    let perfList = [];
    let ind = 0;
    let totPercent = 0;
    let prevMonth = moment(this.props.trades[0].createdAt).format("YYYY-MM");
    let prevPrice = this.props.trades[0].price;
    for (let element of this.props.trades) {
      if (prevMonth !== moment(element.createdAt).format("YYYY-MM")) {
        //summarize prev month result
        let obj = { month: prevMonth, monthPercent: totPercent, price: prevPrice };
        perfList.push(obj);
        totPercent = 0;
        prevMonth = moment(element.createdAt).format("YYYY-MM");
        prevPrice = element.price;
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
      if (!isNaN(percent)) {
        totPercent += percent;
      } else {
        percent = 0;
      }
      ind += 1;
    }
    //summarize last period
    let obj = { month: prevMonth, monthPercent: totPercent, price: prevPrice };
    perfList.push(obj);

    return perfList;
  }

  showSummary(list) {
    if (list.length === 0) return <div />;
    let month = "";
    let tokenVariation = 0;
    let usdVariation = 0;
    let buyHoldVariation = 0;
    let resultRows = [];
    let resultCols = [];
    let title = (
      <td className="p-2">
        Month
        <br />
        Trader token performance
        <br />
        Trader USDT performance
        <br />
        Buy Hold Performance
      </td>
    );
    for (var i = 0; i <= list.length - 1; i++) {
      tokenVariation = list[i].monthPercent;
      month = list[i].month;
      if (i > 0) {
        usdVariation = (list[i].price * list[i - 1].monthPercent) / 100;
        buyHoldVariation = (100 * (list[i].price - list[i - 1].price)) / list[i - 1].price;
      }
      let col = (
        <td className="p-2" align="center">
          {month}
          <br />
          {_.round(tokenVariation, 2)}
          <br />
          {_.round(usdVariation, 2)}
          <br />
          {_.round(buyHoldVariation, 2)}
        </td>
      );
      resultCols.push(col);
      if (i !== 0 && i % 12 === 0) {
        let newRow = (
          <table className="table-bordered">
            <tbody className="border border-dark">
              <tr>
                {title}
                {resultCols}
              </tr>
            </tbody>
          </table>
        );
        resultRows.push(newRow);
      }
    }
    if (i !== 0 && i % 12 !== 0) {
      let newRow = (
        <table className="table-bordered">
          <tbody className="border border-dark">
            <tr>
              {title}
              {resultCols}
            </tr>
          </tbody>
        </table>
      );
      resultRows.push(newRow);
    }

    return resultRows;
  }

  render() {
    if (!this.props.trades[0]) {
      return <div />;
    }
    let title = this.title();
    let summaryList = this.summarize();
    let summaryPanel = this.showSummary(summaryList);
    return (
      <div>
        {title}
        {summaryPanel}
      </div>
    );
  }
}

export default PerformList;

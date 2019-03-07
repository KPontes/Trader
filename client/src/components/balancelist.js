import React, { Component } from "react";
import _ from "lodash";
import moment from "moment";
import axios from "axios";

import sysconfig from "../config";

class BalanceList extends Component {
  constructor(props) {
    super(props);
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.state = {
      balances: this.props.balances
    };
  }

  handleCloseClick(changeEvent) {
    this.props.sendData("hide"); //send to parent
  }

  title() {
    return (
      <div className="bg-light font-weight-bold">
        <div className="row">
          <div className="col-md-6"> Balance Snapshots</div>
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
        <div className="row">
          <div className="col-md-3">Date</div>
          <div className="col-md-2"> Token</div>
          <div className="col-md-2"> Token Value</div>
          <div className="col-md-2"> USD Value</div>
          <div className="col-md-2"> BTC Value</div>
        </div>
      </div>
    );
  }

  List() {
    let listItems = [];
    const listAsset = (balanceArr, createdAt, balanceId) => {
      return balanceArr.map((element, index) => {
        let dateElement =
          index === 0 ? (
            <div className="col-md-3">{moment(createdAt).format("YYYY-MMM-DD hh:mm")}</div>
          ) : (
            <div className="col-md-3" />
          );
        let amount = element.amount !== 0 ? _.round(element.amount, 6) : "";
        let delItem =
          index === 0 ? (
            <div className="col-md-1">
              <span
                className="btn-link cursor-pointer"
                onClick={() => this.handleDelClick(balanceId)}
              >
                Delete
              </span>
            </div>
          ) : (
            <div />
          );
        return (
          <div className="row">
            {dateElement}
            <div className="col-md-2">{element.asset}</div>
            <div className="col-md-2">{amount}</div>
            <div className="col-md-2">{_.round(element.USD, 2)}</div>
            <div className="col-md-2">{_.round(element.BTC, 4)}</div>
            {delItem}
          </div>
        );
      });
    };

    for (let element of this.state.balances) {
      let oneSnapshot = listAsset(element.balance, element.createdAt, element._id);
      listItems.push(oneSnapshot);
      listItems.push(<hr />);
    }
    return listItems;
  }

  Delete(balanceId) {
    let ind = this.state.balances.findIndex(doc => doc._id === balanceId);
    if (ind !== -1) {
      this.state.balances.splice(ind, 1);
    }
  }

  handleDelClick(balanceId) {
    try {
      var _this = this;
      axios({
        method: "delete",
        baseURL: sysconfig.EXECUTER_URI,
        url: "/balance/del",
        data: {
          balanceId
        },
        headers: { "x-auth": this.props.token }
      })
        .then(function(response) {
          if (response.status === 200) {
            _this.Delete(balanceId);
          }
        })
        .catch(function(error) {
          console.log(error);
          alert("Error: " + error.response.data.message);
        });
    } catch (e) {
      console.log(e);
    }
  }

  render() {
    if (!this.state.balances || this.state.balances.length === 0) {
      return <div />;
    }
    let title = this.title();
    let detail = this.List();
    return (
      <div>
        {title}
        {detail}
      </div>
    );
  }
}

export default BalanceList;

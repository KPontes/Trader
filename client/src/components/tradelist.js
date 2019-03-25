import React, { Component } from "react";
import _ from "lodash";
import moment from "moment";
import Modal from "react-modal";

const customStyles = {
  content: {
    top: "20%",
    left: "30%",
    right: "20%",
    bottom: "auto",
    marginRight: "-20%",
    transform: "translate(-20%, -20%)"
  }
};

// Make sure to bind modal to your appElement (http://reactcommunity.org/react-modal/accessibility/)
Modal.setAppElement("#root");

class TradeList extends Component {
  constructor(props) {
    super(props);
    this.handleCloseClick = this.handleCloseClick.bind(this);
    this.openModal = this.openModal.bind(this);
    this.afterOpenModal = this.afterOpenModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.state = {
      msg: "",
      updated: false,
      modalIsOpen: false
    };
  }

  openModal(resultShort) {
    this.setState({ modalIsOpen: true, resultShort });
  }

  afterOpenModal() {
    // references are now sync'd and can be accessed.
    this.subtitle.style.color = "navy";
  }

  closeModal() {
    this.setState({ modalIsOpen: false });
  }

  modalWindow(resultShort) {
    return (
      <span className="btn-link cursor-pointer" onClick={() => this.openModal(resultShort)}>
        Trade Log
      </span>
    );
  }

  showModal() {
    let title = (
      <div className="row">
        <div className="col-md-2">Indicator</div>
        <div className="col-md-1">Oper</div>
        <div className="col-md-1">Factor</div>
        <div className="col-md-8">Rule</div>
      </div>
    );
    let strLog = this.state.resultShort.map(elem => {
      return (
        <div className="row" style={{ fontSize: "small" }}>
          <div className="col-md-2">{elem.indic}</div>
          <div className="col-md-1">{elem.oper}</div>
          <div className="col-md-1">{elem.factor}</div>
          <div className="col-md-8">{elem.rules}</div>
        </div>
      );
    });
    return (
      <Modal
        isOpen={this.state.modalIsOpen}
        onAfterOpen={this.afterOpenModal}
        onRequestClose={this.closeModal}
        style={customStyles}
        contentLabel="Example Modal"
      >
        {" "}
        <div className="row">
          <div className="col-md-4">
            <h5 ref={subtitle => (this.subtitle = subtitle)}>Trade Decision Logs</h5>
          </div>
          <div className="col-md-8" align="right">
            <button className="btn btn-dark btn-sm" onClick={this.closeModal}>
              close
            </button>
          </div>
        </div>
        <div>
          {title}
          {strLog}
        </div>
      </Modal>
    );
  }

  handleCloseClick(changeEvent) {
    this.props.sendData("hide"); //send to parent
  }

  componentDidUpdate() {
    if (this.props.trades[0] && !this.state.updated) {
      let market = this.props.trades[0].symbol.slice(-4) === "USDT" ? "USDT" : "BTC";
      let len = this.props.trades[0].symbol.length;
      let token = this.props.trades[0].symbol.substr(0, len - market.length);
      this.setState({ token, market, updated: true });
    }
  }

  componentDidMount() {
    if (this.props.trades[0] && !this.state.updated) {
      let market = this.props.trades[0].symbol.slice(-4) === "USDT" ? "USDT" : "BTC";
      let len = this.props.trades[0].symbol.length;
      let token = this.props.trades[0].symbol.substr(0, len - market.length);
      this.setState({ token, market, updated: true });
    }
  }

  title() {
    return (
      <div className="bg-light font-weight-bold">
        <div className="row">
          <div className="col-md-6"> Trade List</div>
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
        <div className="row" align="right">
          <div className="col-md-1" align="center">
            {" "}
            Operation
          </div>
          <div className="col-md-1"> Rate</div>
          <div className="col-md-2"> {this.state.token}</div>
          <div className="col-md-2"> {this.state.market}</div>
          <div className="col-md-1"> Diff</div>
          <div className="col-md-1"> %</div>
          <div className="col-md-2"> Date</div>
          <div className="col-md-2"> Action</div>
        </div>
      </div>
    );
  }

  List() {
    let listItems = [];
    let ind = 0;
    let totPercent = 0;
    for (let element of this.props.trades) {
      let modalWindow = this.modalWindow(element.log.resultShort);
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
      } else {
        percent = 0;
      }
      listItems.push(
        <div className="bg-light" align="right">
          <div className="row">
            <div className="col-md-1" align="center">
              {" "}
              {element.side}
            </div>
            <div className="col-md-1"> {_.round(element.price, 4)}</div>
            <div className="col-md-2"> {_.round(tokenAmount, 4)}</div>
            <div className="col-md-2"> {_.round(marketAmount, 2)}</div>
            <div className="col-md-1">
              <label className={color}>{_.round(diff, 4)}</label>
            </div>
            <div className="col-md-1">
              <label className={color}>{_.round(percent, 2)}</label>
            </div>
            <div className="col-md-2">{moment(element.createdAt).format("YYYY-MM-DD hh:mm")}</div>
            <div className="col-md-2"> {modalWindow}</div>{" "}
          </div>
        </div>
      );
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
    let detail = this.List();
    let showModal = <div />;
    if (this.state.modalIsOpen) {
      showModal = this.showModal();
    }
    return (
      <div>
        {title}
        {detail}
        {showModal}
      </div>
    );
  }
}

export default TradeList;

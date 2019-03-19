const moment = require("moment");
const axios = require("axios");
const _ = require("lodash");
const crypto = require("crypto");

("use strict");

var _this = this;

const EXCHANGE_URL = "https://api.binance.com";

exports.putOrder = function(oper, pair, type, quantity, price, mode, tk, sk) {
  return new Promise(async function(resolve, reject) {
    let serverTime = await _this.serverTime();
    let orderObj = {
      symbol: pair,
      side: oper,
      type,
      quantity,
      recvWindow: 10000,
      timestamp: serverTime
    };
    if (type === "LIMIT") {
      orderObj.price = price;
      orderObj.timeInForce = "FOK";
    }
    let query = Object.keys(orderObj)
      .reduce(function(arr, key) {
        arr.push(key + "=" + encodeURIComponent(orderObj[key]));
        return arr;
      }, [])
      .join("&");

    let signature = crypto
      .createHmac("sha256", sk)
      .update(query)
      .digest("hex"); // set the HMAC hash header
    query = query + "&signature=" + signature;
    let queryMode = mode === "real" ? "" : "/test";

    var axiosObj = {
      headers: { "X-MBX-APIKEY": tk },
      method: "post",
      baseURL: EXCHANGE_URL,
      url: `/api/v3/order${queryMode}?${query}`
    };

    axios(axiosObj)
      .then(res => resolve(res.data))
      .catch(err => {
        console.log("Err putOrder: ");
        if (err.response) {
          console.log(`${err.response.status}: ${err.response.statusText} - ${err.response.data}`);
        }
        reject(err);
      });
  });
};

exports.accountInfo = function(tk, sk) {
  return new Promise(async function(resolve, reject) {
    let serverTime = await _this.serverTime();
    let orderObj = {
      recvWindow: 10000,
      timestamp: serverTime
    };

    let query = Object.keys(orderObj)
      .reduce(function(arr, key) {
        arr.push(key + "=" + encodeURIComponent(orderObj[key]));
        return arr;
      }, [])
      .join("&");

    let signature = crypto
      .createHmac("sha256", sk)
      .update(query)
      .digest("hex"); // set the HMAC hash header
    query = query + "&signature=" + signature;

    var axiosObj = {
      headers: { "X-MBX-APIKEY": tk },
      method: "get",
      baseURL: EXCHANGE_URL,
      url: `/api/v3/account?${query}`
    };

    axios(axiosObj)
      .then(res => resolve(res.data))
      .catch(err => {
        console.log("Err accountInfo: ");
        if (err.response) {
          console.log(`${err.response.status}: ${err.response.statusText} - ${err.response.data}`);
        }
        reject(err);
      });
  });
};

exports.bookTicker = function(pair) {
  return new Promise(function(resolve, reject) {
    var url = `${process.env["EXCHANGE_URL"]}/api/v3/ticker/bookTicker`;
    if (pair !== "") {
      url = `${url}?symbol=${pair}`;
    }
    axios
      .get(url)
      .then(res => {
        resolve(res.data);
      })
      .catch(err => {
        console.log("Err bookTicker: ");
        if (err.response) {
          console.log(`${err.response.status}: ${err.response.statusText} - ${err.response.data}`);
        }
        reject(err);
      });
  });
};

exports.exchangeInfo = function() {
  return new Promise(function(resolve, reject) {
    var url = `${process.env["EXCHANGE_URL"]}/api/v1/exchangeInfo`;
    axios
      .get(url)
      .then(res => {
        resolve(res.data);
      })
      .catch(err => {
        console.log("Err exchangeInfo: ");
        if (err.response) {
          console.log(`${err.response.status}: ${err.response.statusText} - ${err.response.data}`);
        }
        reject(err);
      });
  });
};

exports.lotSize = function(exchangeInfo, symbol) {
  try {
    let foundSymbol = exchangeInfo.symbols.find(doc => doc.symbol === symbol);
    if (!foundSymbol) return -1;
    let filter = foundSymbol.filters.find(doc => doc.filterType === "LOT_SIZE");
    if (!filter) return -1;
    let roundTo = filter.minQty.indexOf("1");
    if (roundTo === 0) {
      return roundTo;
    } else {
      return roundTo - 1;
    }
  } catch (err) {
    return err;
  }
};

exports.minNotional = function(exchangeInfo, symbol) {
  try {
    let foundSymbol = exchangeInfo.symbols.find(doc => doc.symbol === symbol);
    if (!foundSymbol) return Number.MAX_SAFE_INTEGER;
    let filter = foundSymbol.filters.find(doc => doc.filterType === "MIN_NOTIONAL");
    if (!filter) return Number.MAX_SAFE_INTEGER;
    return filter.minNotional;
  } catch (err) {
    return err;
  }
};

exports.serverTime = function() {
  return new Promise(function(resolve, reject) {
    // var tradeTime = moment().valueOf();
    // tradeTime = tradeTime.toString();
    axios
      .get(EXCHANGE_URL + "/api/v1/time")
      .then(res => {
        resolve(res.data.serverTime.toString());
      })
      .catch(err => {
        console.log("Err serverTime: ");
        if (err.response) {
          console.log(`${err.response.status}: ${err.response.statusText} - ${err.response.data}`);
        }
        reject(err);
      });
  });
};

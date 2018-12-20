const moment = require("moment");
const axios = require("axios");
const _ = require("lodash");
const crypto = require("crypto");

("use strict");

var _this = this;

const EXCHANGE_URL = "https://api.binance.com";

exports.putOrder = function(oper, pair, type, quantity, tk, sk) {
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
      method: "post",
      baseURL: EXCHANGE_URL,
      url: `/api/v3/order/test?${query}`
    };

    axios(axiosObj)
      .then(res => resolve(res.data))
      .catch(err => {
        console.log("Err putOrder: ");
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
        console.log("Err accountInfo: ", err);
        reject(err);
      });
  });
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
        console.log("Err serverTime: ", err);
        reject(err);
      });
  });
};

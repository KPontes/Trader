const moment = require("moment");
const axios = require("axios");
const _ = require("lodash");
const crypto = require("crypto");

("use strict");

var _this = this;

exports.getKLines = function(pair, interval) {
  return new Promise(function(resolve, reject) {
    axios
      .get(
        `https://www.binance.com/api/v1/klines?symbol=${pair}&interval=${interval}`
      )
      .then(res => {
        var tokenData = res.data;
        let trades = [];
        tokenData.map(element => {
          var kLine = {};
          kLine.openTime = element[0];
          kLine.open = _.round(Number(element[1]), 12);
          kLine.high = _.round(Number(element[2]), 12);
          kLine.low = _.round(Number(element[3]), 12);
          kLine.close = _.round(Number(element[4]), 12);
          kLine.volume = _.round(Number(element[5]), 12);
          kLine.closeTime = element[6];
          kLine.numberOf = parseInt(element[8]);
          trades.push(kLine);
        });
        resolve(trades);
      })
      .catch(err => {
        console.log("Err getKLines: ", err);
        reject(err);
      });
  });
};

exports.symbolPrice = function(pair) {
  return new Promise(function(resolve, reject) {
    var url = `${process.env["EXCHANGE_URL"]}/api/v3/ticker/price`;
    if (pair !== "") {
      url = `${url}?symbol=${pair}`;
    }
    axios
      .get(url)
      .then(res => {
        resolve(res.data);
      })
      .catch(err => {
        console.log("Err symbolPrice: ", err);
        reject(err);
      });
  });
};

exports.serverTime = function() {
  return new Promise(function(resolve, reject) {
    // var tradeTime = moment().valueOf();
    // tradeTime = tradeTime.toString();
    axios
      .get(process.env["EXCHANGE_URL"] + "/api/v1/time")
      .then(res => {
        resolve(res.data.serverTime.toString());
      })
      .catch(err => {
        console.log("Err serverTime: ", err);
        reject(err);
      });
  });
};

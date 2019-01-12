const moment = require("moment");
const axios = require("axios");
const _ = require("lodash");
const crypto = require("crypto");

const binance = require("./binance");

("use strict");

var _this = this;
//binance set as default template
//for other exchaneges will need to Normalize results
exports.getKLines = function(exchange, pair, interval) {
  return new Promise(async function(resolve, reject) {
    try {
      if ((exchange = "binance")) {
        var data = await binance.getKLines(pair, interval);
      }
      resolve(data);
    } catch (err) {
      console.log("Err exchange getKLines: ");
      reject(err);
    }
  });
};

exports.symbolPrice = function(exchange, pair = "") {
  return new Promise(async function(resolve, reject) {
    try {
      if ((exchange = "binance")) {
        var data = await binance.symbolPrice(pair);
      }
      resolve(data);
    } catch (err) {
      console.log("Err exchange symbolPrice: ");
      reject(err);
    }
  });
};

exports.serverTime = function(exchange) {
  return new Promise(async function(resolve, reject) {
    try {
      if ((exchange = "binance")) {
        var data = await binance.serverTime();
      }
      resolve(data);
    } catch (err) {
      console.log("Err exchange serverTime: ", err);
      reject(err);
    }
  });
};

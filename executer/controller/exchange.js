const binance = require("./binance");

("use strict");

var _this = this;
//binance set as default template
//for other exchaneges will need to Normalize results
exports.putOrder = function(exchange, oper, symbol, type, amount, tk, sk) {
  return new Promise(async function(resolve, reject) {
    try {
      if (exchange === "binance") {
        var data = await binance.putOrder(oper, symbol, type, amount, tk, sk);
      }
      resolve(data);
    } catch (err) {
      console.log("Err exchange putOrder: ", err);
      reject(err);
    }
  });
};

exports.accountInfo = function(exchange, tk, sk) {
  return new Promise(async function(resolve, reject) {
    try {
      if (exchange === "binance") {
        var data = await binance.accountInfo(tk, sk);
      }
      resolve(data);
    } catch (err) {
      console.log("Err exchange accountInfo: ", err);
      reject(err);
    }
  });
};

exports.getKLines = function(exchange, pair, interval) {
  return new Promise(async function(resolve, reject) {
    try {
      if (exchange === "binance") {
        var data = await binance.getKLines(pair, interval);
      }
      resolve(data);
    } catch (err) {
      console.log("Err exchange getKLines: ", err);
      reject(err);
    }
  });
};

exports.symbolPrice = function(exchange, pair) {
  return new Promise(async function(resolve, reject) {
    try {
      if (exchange === "binance") {
        var data = await binance.symbolPrice(pair);
      }
      resolve(data);
    } catch (err) {
      console.log("Err exchange symbolPrice: ", err);
      reject(err);
    }
  });
};

exports.serverTime = function(exchange) {
  return new Promise(async function(resolve, reject) {
    try {
      if (exchange === "binance") {
        var data = await binance.serverTime();
      }
      resolve(data);
    } catch (err) {
      console.log("Err exchange symbolPrice: ", err);
      reject(err);
    }
  });
};

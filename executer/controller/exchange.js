const binance = require("./binance");

("use strict");

var _this = this;
//binance set as default template
//for other exchaneges will need to Normalize results
exports.putOrder = function(exchange, oper, symbol, type, amount, price, mode, tk, sk) {
  return new Promise(async function(resolve, reject) {
    try {
      if (exchange === "binance") {
        var data = await binance.putOrder(oper, symbol, type, amount, price, mode, tk, sk);
      }
      resolve(data);
    } catch (err) {
      console.log("Err exchange putOrder: ");
      if (err.response) {
        console.log(`${err.response.status}: ${err.response.statusText} - ${err.response.data}`);
      }
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
      console.log("Err exchange accountInfo: ");
      if (err.response) {
        console.log(`${err.response.status}: ${err.response.statusText} - ${err.response.data}`);
      }
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
      console.log("Err exchange getKLines: ");
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

exports.bookTicker = function(exchange, pair = "") {
  return new Promise(async function(resolve, reject) {
    try {
      if ((exchange = "binance")) {
        var data = await binance.bookTicker(pair);
      }
      resolve(data);
    } catch (err) {
      console.log("Err exchange bookTicker: ");
      reject(err);
    }
  });
};

exports.exchangeInfo = function(exchange) {
  return new Promise(async function(resolve, reject) {
    try {
      if ((exchange = "binance")) {
        var data = await binance.exchangeInfo();
      }
      resolve(data);
    } catch (err) {
      console.log("Err exchange exchangeInfo: ");
      reject(err);
    }
  });
};

exports.lotSize = function(exchangeInfo, symbol) {
  try {
    if ((exchange = "binance")) {
      var data = binance.lotSize(exchangeInfo, symbol);
    }
    return data;
  } catch (err) {
    console.log("Err exchange lotSize: ");
    return err;
  }
};

exports.minNotional = function(exchangeInfo, symbol) {
  try {
    if ((exchange = "binance")) {
      var data = binance.minNotional(exchangeInfo, symbol);
    }
    return data;
  } catch (err) {
    console.log("Err exchange minNotional: ");
    return err;
  }
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

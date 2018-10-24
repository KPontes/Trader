const moment = require("moment");
const _ = require("lodash");
const fs = require("fs-extra");

("use strict");

var _this = this;
const logFile = "./logs/logMA.txt";
const tradeFile = "./logs/tradeMA.txt";

exports.execute = function(data, pair, params) {
  return new Promise(async function(resolve, reject) {
    try {
      var result = await process_MA(data, params);
      resolve(result);
    } catch (err) {
      console.log("Err movingAvg execute: ", err);
      reject(err);
    }
  });
};

function process_MA(data, params) {
  return new Promise(async function(resolve, reject) {
    try {
      var shortMA = await calculateSMA(data, params[0]);
      var mediumMA = await calculateSMA(data, params[1]);
      var longMA = await calculateSMA(data, params[2]);
      await log(shortMA, mediumMA, longMA);
      result = await applyBusinessRules(data, shortMA, mediumMA, longMA);
      resolve(result);
    } catch (err) {
      console.log("Err process_SMA: ", err);
      reject(err);
    }
  });
}

function applyBusinessRules(data, shortMA, mediumMA, longMA) {
  return new Promise(async function(resolve, reject) {
    try {
      //this obj MUST have two properties, namely: oper, factor
      var objMA = {};
      var factor = 1;
      shortMA.slice(-1) > mediumMA.slice(-1) ||
      shortMA.slice(-1) > longMA.slice(-1)
        ? (oper = "buy")
        : (oper = "sell");
      if (
        shortMA.slice(-1) > mediumMA.slice(-1) &&
        shortMA.slice(-1) > longMA.slice(-1)
      ) {
        oper = "buy";
        factor = 3;
      }
      if (
        shortMA.slice(-1) < mediumMA.slice(-1) &&
        shortMA.slice(-1) < longMA.slice(-1)
      ) {
        oper = "sell";
        factor = 3;
      }
      var line =
        oper +
        " , " +
        factor.toString() +
        " , " +
        moment(data.slice(-1)[0].closeTime).format("YYYYMMDDHHmmss") +
        " , " +
        data.slice(-1)[0].close;
      //console.log(line);
      await fs.appendFile(tradeFile, line + "\r\n");
      objMA.oper = oper;
      objMA.factor = factor;
      resolve(objMA);
    } catch (err) {
      console.log("Err logMA: ", err);
      reject(err);
    }
  });
}

function log(shortMA, mediumMA, longMA) {
  return new Promise(async function(resolve, reject) {
    try {
      let result;
      //await fs.outputFile(logFile, "shortMA: ", err => console.log(err));
      result = await fs.outputFile(logFile, "shortMA: " + "\r\n");
      result = await fs.appendFile(logFile, shortMA.toString() + "\r\n");
      result = await fs.appendFile(logFile, "mediumMA: " + "\r\n");
      result = await fs.appendFile(logFile, mediumMA.toString() + "\r\n");
      result = await fs.appendFile(logFile, "longMA: " + "\r\n");
      result = await fs.appendFile(logFile, longMA.toString() + "\r\n");
      resolve("OK");
    } catch (err) {
      console.log("Err logMA: ", err);
      reject(err);
    }
  });
}

const calculateEMA = function(data, period) {
  return new Promise(async function(resolve, reject) {
    // Initial SMA: 10-period sum / 10
    // Multiplier: (2 / (Time periods + 1) ) = (2 / (10 + 1) ) = 0.1818 (18.18%)
    // EMA: {Close - EMA(previous day)} x multiplier + EMA(previous day).
    try {
      var arrEMA = [];
      var _sum = 0;
      var initPeriod = data.slice(0, period);
      //initial period SMA
      var initialSMA = initPeriod
        .map(item => item.close)
        .reduce((a, b) => a + b, 0);
      initialSMA = _.round(initialSMA / period, 12);
      //calc multiplier
      var multiplier = _.round(2 / (period + 1), 12);
      //calc EMA as a sliding window within the period
      for (var i = 0; i < data.length; i++) {
        if (i < period) {
          arrEMA[i] = initialSMA;
        } else {
          arrEMA[i] =
            multiplier * (data[i].close - arrEMA[i - 1]) + arrEMA[i - 1];
          arrEMA[i] = _.round(arrEMA[i], 12);
        }
      }
      resolve(arrEMA);
    } catch (err) {
      console.log("Err process_EMA: ", err);
      reject(err);
    }
  });
};

const calculateSMA = function(data, period) {
  return new Promise(async function(resolve, reject) {
    try {
      var arrSMA = [];
      var _sum = 0;
      var initPeriod = data.slice(0, period);
      //initial period absolute sum
      _sum = initPeriod.map(item => item.close).reduce((a, b) => a + b, 0);
      //sum as a sliding window within the period
      for (var i = 0; i < data.length; i++) {
        if (i < period) {
          arrSMA[i] = _sum;
        } else {
          arrSMA[i] = arrSMA[i - 1] + data[i].close - data[i - period].close;
        }
      }
      //calc average considering the period of sum
      const result = arrSMA.map(item => _.round(item / period, 12));
      resolve(result);
    } catch (err) {
      console.log("Err process_SMA: ", err);
      reject(err);
    }
  });
};

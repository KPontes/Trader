const moment = require("moment");
const _ = require("lodash");
const fs = require("fs-extra");

("use strict");

var _this = this;
const logFile = "./logs/logMA.txt";
const tradeFile = "./logs/tradeMA.txt";
const strategy = "MA";

function execute(data, params) {
  return new Promise(async function(resolve, reject) {
    try {
      var _params = params.split(",");
      var result = await process(data, _params);
      resolve(result);
    } catch (err) {
      console.log(`Err ${strategy} execute`, err);
      //console.log("Err movingAvg execute: ", err);
      reject(err);
    }
  });
}

function process(data, params) {
  return new Promise(async function(resolve, reject) {
    try {
      var arr = data.map(item => item.close);
      var xShortMA = await calculateSMA(arr, params[0]);
      var shortMA = await calculateSMA(arr, parseInt(params[1]));
      var mediumMA = await calculateSMA(arr, parseInt(params[2]));
      var longMA = await calculateSMA(arr, parseInt(params[3]));
      // await log(shortMA, mediumMA, longMA);
      // result = await applyBusinessRules(xShortMA, shortMA, mediumMA, longMA);
      resolve([params, xShortMA, shortMA, mediumMA, longMA]);
    } catch (err) {
      console.log(`Err ${strategy} process:`, err);
      reject(err);
    }
  });
}

function applyBusinessRules(xShortMA, shortMA, mediumMA, longMA) {
  return new Promise(async function(resolve, reject) {
    //Na nova versão tem que carregar os arrays a partir do DB
    try {
      var objMA = [];
      objMA[0] = applyCrossingLines(shortMA, mediumMA, longMA);
      objMA[1] = applyTrend(xShortMA);

      resolve(objMA); //this obj MUST have named properties: oper, factor
    } catch (err) {
      console.log("Err rulesMA: ", err);
      reject(err);
    }
  });
}

function applyCrossingLines(shortMA, mediumMA, longMA) {
  var objMA = { indic: "MA", oper: "none", factor: 1, rules: "no cross line" };

  shortMA.slice(-1) > mediumMA.slice(-1) || shortMA.slice(-1) > longMA.slice(-1)
    ? ((objMA.oper = "buy"), (objMA.rules = "one up cross"))
    : ((objMA.oper = "sell"), (objMA.rules = "one down cross"));
  if (
    shortMA.slice(-1) > mediumMA.slice(-1) &&
    shortMA.slice(-1) > longMA.slice(-1)
  ) {
    objMA.oper = "buy";
    objMA.rules = "two up cross";
    mediumMA.slice(-1) > longMA.slice(-1)
      ? (objMA.factor = 4)
      : (objMA.factor = 2);
  }
  if (
    shortMA.slice(-1) < mediumMA.slice(-1) &&
    shortMA.slice(-1) < longMA.slice(-1)
  ) {
    objMA.oper = "sell";
    objMA.rules = "two down cross";
    mediumMA.slice(-1) < longMA.slice(-1)
      ? (objMA.factor = 4)
      : (objMA.factor = 2);
  }

  return objMA;
}

function applyTrend(xshortMA) {
  var objMA = { indic: "MA", oper: "none", factor: 0, rules: "" };
  //downtrend curve
  if (
    xshortMA.slice(-1) < xshortMA.slice(-2, -1) &&
    xshortMA.slice(-2, -1) < xshortMA.slice(-3, -2)
  ) {
    objMA.oper = "sell";
    objMA.factor = 3;
    objMA.rules = "change to down trend";
  }
  //uptrend curve
  if (
    xshortMA.slice(-1) > xshortMA.slice(-2, -1) &&
    xshortMA.slice(-2, -1) > xshortMA.slice(-3, -2)
  ) {
    objMA.oper = "buy";
    objMA.factor = 3;
    objMA.rules = "change to up trend";
  }

  return objMA;
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

function calculateEMA(data, period) {
  return new Promise(async function(resolve, reject) {
    // Initial SMA: 10-period sum / 10
    // Multiplier: (2 / (Time periods + 1) ) = (2 / (10 + 1) ) = 0.1818 (18.18%)
    // EMA: {Close - EMA(previous day)} x multiplier + EMA(previous day).
    try {
      var arrEMA = [];
      var _sum = 0;
      var initPeriod = data.slice(0, period);
      //initial period SMA
      var initialSMA = initPeriod.reduce((a, b) => a + b, 0);
      initialSMA = _.round(initialSMA / period, 12);
      //calc multiplier
      var multiplier = _.round(2 / (period + 1), 12);
      //calc EMA as a sliding window within the period
      for (var i = 0; i < data.length; i++) {
        if (i < period) {
          arrEMA[i] = initialSMA;
        } else {
          arrEMA[i] = multiplier * (data[i] - arrEMA[i - 1]) + arrEMA[i - 1];
          arrEMA[i] = _.round(arrEMA[i], 12);
        }
      }
      resolve(arrEMA);
    } catch (err) {
      console.log("Err calculate_EMA: ", err);
      reject(err);
    }
  });
}

function calculateSMA(data, period) {
  return new Promise(async function(resolve, reject) {
    try {
      var arrSMA = [];
      var _sum = 0;
      var initPeriod = data.slice(0, period);
      //initial period absolute sum
      _sum = initPeriod.reduce((a, b) => a + b, 0);
      //sum as a sliding window within the period
      for (var i = 0; i < data.length; i++) {
        if (i < period) {
          arrSMA[i] = _sum;
        } else {
          arrSMA[i] = arrSMA[i - 1] + data[i] - data[i - period];
        }
      }
      //calc average considering the period of sum
      const result = arrSMA.map(item => _.round(item / period, 12));
      resolve(result);
    } catch (err) {
      console.log("Err calculate_SMA: ", err);
      reject(err);
    }
  });
}

module.exports = {
  execute: execute,
  calculateSMA: calculateSMA,
  calculateEMA: calculateEMA,
  applyBusinessRules: applyBusinessRules
};

const moment = require("moment");
const _ = require("lodash");
const fs = require("fs-extra");

const mavg = require("./movingAvg.js");

("use strict");

var _this = this;
const strategy = "MACD";

function execute(data) {
  return new Promise(async function(resolve, reject) {
    try {
      var result = await process(data, params);
      resolve(result);
    } catch (err) {
      console.log(`Err ${strategy} execute`, err);
      reject(err);
    }
  });
}

function process(data) {
  return new Promise(async function(resolve, reject) {
    try {
      var macdData = await calculate(data);
      result = await applyBusinessRules(macdData);
      resolve(result);
    } catch (err) {
      console.log(`Err ${strategy} process`, err);
      reject(err);
    }
  });
}

function applyBusinessRules(macd) {
  return new Promise(async function(resolve, reject) {
    try {
      var objMACD = [{ indic: "MACD", oper: "none", factor: 0, rules: "" }];
      if (
        macd.macdLine.slice(-1) > macd.signal.slice(-1) &&
        macd.macdLine.slice(-1) > 0
      ) {
        objMACD[0].oper = "buy";
        objMACD[0].factor = 3;
        objMACD[0].rules = "macd above signal & 0";
        if (macd.short.slice(-1) > macd.long.slice(-1)) {
          objMACD[0].factor = 4;
          objMACD[0].rules += " / short > long";
        }
      }
      if (
        macd.macdLine.slice(-1) < macd.signal.slice(-1) &&
        macd.macdLine.slice(-1) < 0
      ) {
        objMACD[0].oper = "sell";
        objMACD[0].factor = 3;
        objMACD[0].rules = "macd bellow signal & 0";
        if (macd.short.slice(-1) < macd.long.slice(-1)) {
          objMACD[0].factor = 4;
          objMACD[0].rules += " / short < long";
        }
      }

      resolve(objMACD); //this obj MUST have named properties: oper, factor
    } catch (err) {
      console.log(`Err ${strategy} rules`, err);
      reject(err);
    }
  });
}

const calculate = function(data, short, long, signal) {
  return new Promise(async function(resolve, reject) {
    try {
      // MACD Line: (12-day EMA - 26-day EMA)
      // Signal Line: 9-day EMA of MACD Line
      // MACD Histogram: MACD Line - Signal Line
      const objMACD = {};
      const arr = data.map(item => item.close);
      objMACD.short = await mavg.calculateEMA(arr, short);
      objMACD.long = await mavg.calculateEMA(arr, long);
      objMACD.macdLine = objMACD.short.map((a, i) =>
        _.round(a - objMACD.long[i], 12)
      );
      objMACD.signal = await mavg.calculateEMA(objMACD.macdLine, signal);

      resolve(objMACD);
    } catch (err) {
      console.log(`Err ${strategy} calculate`, err);
      reject(err);
    }
  });
};

module.exports = {
  calculate: calculate
};

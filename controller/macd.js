const moment = require("moment");
const _ = require("lodash");
const fs = require("fs-extra");

const mavg = require("./movingAvg.js");

("use strict");

var _this = this;
const logFile = "./logs/logMACD.txt";
const strategy = "MACD";

exports.execute = function(data, params) {
  return new Promise(async function(resolve, reject) {
    try {
      var result = await process(data, params);
      resolve(result);
    } catch (err) {
      console.log(`Err ${strategy} execute`, err);
      reject(err);
    }
  });
};

function process(data, params) {
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

const calculate = function(data, period) {
  return new Promise(async function(resolve, reject) {
    try {
      // MACD Line: (12-day EMA - 26-day EMA)
      // Signal Line: 9-day EMA of MACD Line
      // MACD Histogram: MACD Line - Signal Line
      const objMACD = {};
      const arr = data.map(item => item.close);
      objMACD.short = await mavg.calculateEMA(arr, 12);
      objMACD.long = await mavg.calculateEMA(arr, 26);
      objMACD.macdLine = objMACD.short.map((a, i) =>
        _.round(a - objMACD.long[i], 12)
      );
      objMACD.signal = await mavg.calculateEMA(objMACD.macdLine, 9);
      await log(objMACD);

      resolve(objMACD);
    } catch (err) {
      console.log(`Err ${strategy} calculate`, err);
      reject(err);
    }
  });
};

function log(objMACD) {
  return new Promise(async function(resolve, reject) {
    try {
      await fs.outputFile(logFile, "macdData: " + "\r\n");
      await fs.appendFile(logFile, objMACD.macdLine + "\r\n");
      await fs.appendFile(logFile, "signal: " + "\r\n");
      await fs.appendFile(logFile, objMACD.signal + "\r\n");
      await fs.appendFile(logFile, "short: " + "\r\n");
      await fs.appendFile(logFile, objMACD.short + "\r\n");
      await fs.appendFile(logFile, "long: " + "\r\n");
      await fs.appendFile(logFile, objMACD.long + "\r\n");
      resolve("OK");
    } catch (err) {
      console.log(`Err ${strategy} log`, err);
      reject(err);
    }
  });
}

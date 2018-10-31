const moment = require("moment");
const _ = require("lodash");
const fs = require("fs-extra");

const mavg = require("./movingAvg.js");
const stdev = require("../utils/stdev.js");

("use strict");

var _this = this;
const logFile = "./logs/logBBands.txt";
const strategy = "BBands";

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
      var bbands = await calculate(data, parseInt(params));
      result = await applyBusinessRules(bbands);
      resolve(result);
    } catch (err) {
      console.log(`Err ${strategy} process`, err);
      reject(err);
    }
  });
}

function applyBusinessRules(bbands) {
  return new Promise(async function(resolve, reject) {
    try {
      const recent = -200;
      var count = 0;
      const countOverBought = bbands.slice(recent).map(function(element) {
        if (element.close > element.upper) {
          count++;
        }
        return count;
      });
      var count = 0;
      const countOverSold = bbands.slice(recent).map(function(element) {
        if (element.close < element.lower) {
          count++;
        }
        return count;
      });
      var objBBands = [{ indic: "BBANDS", oper: "none", factor: 0, rules: "" }];
      if (bbands.slice(-1)[0].close > bbands.slice(-1)[0].upper) {
        objBBands[0].oper = "sell";
        objBBands[0].factor = 3;
        objBBands[0].rules = "bbands overbought";
        if (countOverBought > 2) {
          objBBands[0].oper = "buy"; //walking upper band on trend
          objBBands[0].rules += " / walk upper band";
        }
      }
      if (bbands.slice(-1)[0].close < bbands.slice(-1)[0].lower) {
        objBBands[0].oper = "buy";
        objBBands[0].factor = 3;
        objBBands[0].rules = "bbands oversold";
        if (countOverSold > 2) {
          objBBands[0].oper = "sell"; //walking lower band on trend
          objBBands[0].rules += " / walk lower band";
        }
      }

      resolve(objBBands); //this obj MUST have named properties: oper, factor
    } catch (err) {
      console.log(`Err ${strategy} rules`, err);
      reject(err);
    }
  });
}

const calculate = function(data, period) {
  return new Promise(async function(resolve, reject) {
    try {
      // Middle Band = 20-day simple moving average (SMA)
      // Upper Band = 20-day SMA + (20-day standard deviation of price x 2)
      // Lower Band = 20-day SMA - (20-day standard deviation of price x 2)
      var oBBands = {};
      var bbands = [];
      const arr = data.map(item => item.close);
      const middle = await mavg.calculateSMA(arr, 20);
      for (var i = 0; i < data.length; i++) {
        oBBands = {
          close: 0,
          middle: 0,
          stdev: 0,
          upper: 0,
          lower: 0,
          bandWidth: 0
        };
        oBBands.close = _.round(data[i].close, 12);
        oBBands.middle = middle[i];
        if (i >= period) {
          oBBands.stdev = _.round(stdev.stdev(arr.slice(i - period, i)), 12);
          oBBands.upper = _.round(oBBands.middle + oBBands.stdev * 2, 12);
          oBBands.lower = _.round(oBBands.middle - oBBands.stdev * 2, 12);
          oBBands.bandWidth = oBBands.upper - oBBands.lower;
        }
        bbands.push(oBBands);
      }
      await log(bbands);

      resolve(bbands);
    } catch (err) {
      console.log(`Err ${strategy} calculate`, err);
      reject(err);
    }
  });
};

function log(bbands) {
  return new Promise(async function(resolve, reject) {
    try {
      await fs.outputFile(logFile, JSON.stringify(bbands) + "\r\n");
      resolve("OK");
    } catch (err) {
      console.log(`Err ${strategy} log`, err);
      reject(err);
    }
  });
}

const { ILoader } = require("../models/indicatorLoader.js");
const mavg = require("./movingAvg.js");

("use strict");

var _this = this;
const strategy = "BBands";

function getData(exchange, symbol, period) {
  return new Promise(async function(resolve, reject) {
    try {
      var arr = await ILoader.findOne({
        exchange,
        symbol,
        period,
        name: "BBANDS"
      });
      resolve(arr);
    } catch (err) {
      console.log(`Err ${strategy} getData:`, err);
      reject(err);
    }
  });
}

function applyBusinessRules(bbands, recent) {
  return new Promise(async function(resolve, reject) {
    try {
      const countOverBought = bbands
        .slice(-recent)
        .map(function(element) {
          return element.close > element.upper ? 1 : 0;
        })
        .reduce((acc, currValue) => {
          return acc + currValue;
        }, 0);

      const countOverSold = bbands
        .slice(-recent)
        .map(function(element) {
          return element.close < element.lower ? 1 : 0;
        })
        .reduce((acc, currValue) => {
          return acc + currValue;
        }, 0);

      var objBBands = [{ indic: "BBANDS", oper: "none", factor: 0, rules: "" }];
      if (bbands.slice(-1)[0].close > bbands.slice(-1)[0].upper) {
        objBBands[0].oper = "sell";
        objBBands[0].factor = 3;
        objBBands[0].rules = "bbands overbought";
        if (countOverBought > countOverSold && countOverBought >= 3) {
          objBBands[0].oper = "buy"; //walking upper band on trend
          objBBands[0].rules += " / walk upper band";
        }
      }
      if (bbands.slice(-1)[0].close < bbands.slice(-1)[0].lower) {
        objBBands[0].oper = "buy";
        objBBands[0].factor = 3;
        objBBands[0].rules = "bbands oversold";
        if (countOverSold > countOverBought && countOverSold >= 3) {
          objBBands[0].oper = "sell"; //walking lower band on trend
          objBBands[0].rules += " / walk lower band";
        }
      }
      resolve(objBBands);
    } catch (err) {
      console.log(`Err ${strategy} rules`, err);
      reject(err);
    }
  });
}

module.exports = {
  getData: getData,
  applyBusinessRules: applyBusinessRules
};

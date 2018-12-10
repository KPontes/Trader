const { ILoader } = require("../models/indicatorLoader.js");
const mavg = require("./movingAvg.js");

("use strict");

var _this = this;
const strategy = "MACD";

function getData(exchange, symbol, period) {
  return new Promise(async function(resolve, reject) {
    try {
      var arr = await ILoader.findOne({
        exchange,
        symbol,
        period,
        name: "MACD"
      });
      resolve(arr);
    } catch (err) {
      console.log(`Err ${strategy} getData:`, err);
      reject(err);
    }
  });
}

function applyBusinessRules(macd) {
  return new Promise(async function(resolve, reject) {
    try {
      var objMACD = [{ indic: "MACD", oper: "none", factor: 0, rules: "" }];
      if (
        macd.macdLine.slice(-1)[0] > macd.signal.slice(-1)[0] &&
        macd.macdLine.slice(-1)[0] > 0
      ) {
        objMACD[0].oper = "buy";
        objMACD[0].factor = 2;
        objMACD[0].rules = "macd above signal & 0";
        if (macd.short.slice(-1) > macd.long.slice(-1)) {
          objMACD[0].factor = 3;
          objMACD[0].rules += " / short > long";
        }
      }
      if (
        macd.macdLine.slice(-1)[0] < macd.signal.slice(-1)[0] &&
        macd.macdLine.slice(-1)[0] < 0
      ) {
        objMACD[0].oper = "sell";
        objMACD[0].factor = 2;
        objMACD[0].rules = "macd bellow signal & 0";
        if (macd.short.slice(-1) < macd.long.slice(-1)) {
          objMACD[0].factor = 3;
          objMACD[0].rules += " / short < long";
        }
      }

      resolve(objMACD);
    } catch (err) {
      console.log(`Err ${strategy} rules`, err);
      reject(err);
    }
  });
}

module.exports = {
  applyBusinessRules: applyBusinessRules,
  getData: getData
};

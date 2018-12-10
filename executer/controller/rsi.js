const _ = require("lodash");

const { ILoader } = require("../models/indicatorLoader.js");

("use strict");

var _this = this;

const strategy = "RSI";

function getData(exchange, symbol, period) {
  return new Promise(async function(resolve, reject) {
    try {
      var arr = await ILoader.findOne({
        exchange,
        symbol,
        period,
        name: "RSI"
      });
      resolve(arr);
    } catch (err) {
      console.log(`Err ${strategy} getData:`, err);
      reject(err);
    }
  });
}

function applyBusinessRules(rsiData, top, bottom, recent) {
  return new Promise(async function(resolve, reject) {
    try {
      var objRSI = [{ indic: "RSI", oper: "none", factor: 0, rules: "" }];
      oTrend = calcTrend(rsiData, recent);

      if (rsiData.slice(-1)[0].rsi > top) {
        if (oTrend.recentGains > oTrend.recentLosses) {
          objRSI[0].oper = "buy";
          objRSI[0].factor = 3;
          objRSI[0].rules = "rsi>top with recent uptrend";
        } else {
          objRSI[0].oper = "sell";
          objRSI[0].factor = 3;
          objRSI[0].rules = "rsi>top with recent downtrend";
        }
      }
      if (rsiData.slice(-1)[0].rsi < bottom) {
        if (oTrend.recentGains < oTrend.recentLosses) {
          objRSI[0].oper = "sell";
          objRSI[0].factor = 3;
          objRSI[0].rules = "rsi<bottom with recent downtrend";
        } else {
          objRSI[0].oper = "buy";
          objRSI[0].factor = 3;
          objRSI[0].rules = "rsi<bottom with recent uptrend";
        }
      }
      if (rsiData.slice(-1)[0].rsi > bottom && rsiData.slice(-1)[0].rsi < top) {
        objRSI[0].oper = "none";
        objRSI[0].factor = 0;
        objRSI[0].rules = `${bottom}<rsi<${top}`;
        if (
          oTrend.recentGains > oTrend.recentLosses &&
          oTrend.countGains > oTrend.last * 0.65
        ) {
          objRSI[0].oper = "buy";
          objRSI[0].factor = 1;
          objRSI[0].rules += " with uptrend";
        }
        if (
          oTrend.recentGains < oTrend.recentLosses &&
          oTrend.countGains < oTrend.last * 0.35
        ) {
          objRSI[0].oper = "sell";
          objRSI[0].factor = 1;
          objRSI[0].rules += " with downtrend";
        }
      }

      resolve(objRSI);
    } catch (err) {
      console.log(`Err ${strategy} rules`, err);
      reject(err);
    }
  });
}

function calcTrend(rsiData, recent) {
  var countGains = rsiData
    .slice(-recent)
    .map(function(element) {
      return element.gain > 0 ? 1 : 0;
    })
    .reduce((acc, currValue) => {
      return acc + currValue;
    }, 0);

  var recentGains = rsiData
    .slice(-recent)
    .map(function(element) {
      return element.gain;
    })
    .reduce((acc, currValue) => {
      return acc + currValue;
    }, 0);

  var recentLosses = rsiData
    .slice(-recent)
    .map(function(element) {
      return element.loss;
    })
    .reduce((acc, currValue) => {
      return acc + currValue;
    }, 0);

  const objRes = {
    last: recent,
    countGains: countGains,
    gains: _.round(recentGains, 12),
    losses: _.round(recentLosses, 12)
  };
  return objRes;
}

module.exports = {
  applyBusinessRules: applyBusinessRules,
  getData: getData
};

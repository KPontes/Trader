const moment = require("moment");
const _ = require("lodash");
const fs = require("fs-extra");

const { ILoader } = require("../models/indicatorLoader.js");

("use strict");

var _this = this;

const strategy = "RSI";

// function execute(data, params) {
//   return new Promise(async function(resolve, reject) {
//     try {
//       var _params = params.split(",");
//       var result = await process(data, _params);
//       resolve(result);
//     } catch (err) {
//       console.log(`Err ${strategy} execute`, err);
//       reject(err);
//     }
//   });
// }
//
// function process(data, params) {
//   return new Promise(async function(resolve, reject) {
//     try {
//       var rsiData = await calculate(data, params);
//       await log(rsiData);
//       var recent = parseInt(params[1]);
//       var top = parseInt(params[2]);
//       var bottom = parseInt(params[3]);
//       result = await applyBusinessRules(rsiData, top, bottom, recent);
//       resolve(result);
//     } catch (err) {
//       console.log(`Err ${strategy} process`, err);
//       reject(err);
//     }
//   });
// }

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
      if (rsiData.slice(-1)[0].rsi > 40 && rsiData.slice(-1)[0].rsi < 60) {
        objRSI[0].oper = "none";
        objRSI[0].factor = 0;
        objRSI[0].rules = "60>rsi>40";
        if (
          oTrend.recentGains > oTrend.recentLosses &&
          oTrend.countGains > -(oTrend.last * 0.65)
        ) {
          objRSI[0].oper = "buy";
          objRSI[0].factor = 2;
          objRSI[0].rules += " with uptrend";
        }
        if (
          oTrend.recentGains < oTrend.recentLosses &&
          oTrend.countGains < -(oTrend.last * 0.35)
        ) {
          objRSI[0].oper = "sell";
          objRSI[0].factor = 2;
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

// function trend(data, periods) {
//   return new Promise(async function(resolve, reject) {
//     try {
//       var rsiData = await calculate(data, [14]); //first in params
//       objRes = calcTrend(rsiData, periods);
//       resolve(objRes);
//     } catch (err) {
//       console.log(`Err ${strategy} trend`, err);
//       reject(err);
//     }
//   });
// }

function calcTrend(rsiData, recent) {
  var countGains = rsiData
    .slice(recent)
    .map(function(element) {
      return element.gain > 0 ? 1 : 0;
    })
    .reduce((acc, currValue) => {
      return acc + currValue;
    }, 0);

  var recentGains = rsiData
    .slice(recent)
    .map(function(element) {
      return element.gain;
    })
    .reduce((acc, currValue) => {
      return acc + currValue;
    }, 0);

  var recentLosses = rsiData
    .slice(recent)
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

// function log(rsiData) {
//   return new Promise(async function(resolve, reject) {
//     try {
//       var outputLines = rsiData.map(function(element) {
//         return { close: element.close, rsi: element.rsi || 0 };
//       });
//       await fs.outputFile(logFile, JSON.stringify(outputLines) + "\r\n");
//       resolve("OK");
//     } catch (err) {
//       console.log(`Err ${strategy} log`, err);
//       reject(err);
//     }
//   });
// }

// const calculate = function(data, period) {
//   return new Promise(async function(resolve, reject) {
//     try {
//       var iniGain = 0;
//       var iniLoss = 0;
//       var rsiData = [];
//       var oRSI = { close: data[0].close };
//       rsiData[0] = oRSI;
//       for (var i = 1; i <= period; i++) {
//         oRSI = {};
//         oRSI = createRSIObj(data, i, period);
//         rsiData[i] = oRSI;
//         iniGain += oRSI.gain;
//         iniLoss += oRSI.loss;
//       }
//       //first line on period limit
//       oRSI = createRSIObj(data, period, period, iniGain, iniLoss);
//       rsiData[period] = oRSI;
//       // remaining data
//       for (var i = period + 1; i < data.length; i++) {
//         oRSI = {};
//         oRSI = createRSIObj(data, i, period, iniGain, iniLoss, rsiData[i - 1]);
//         rsiData[i] = oRSI;
//       }
//       resolve(rsiData);
//     } catch (err) {
//       console.log(`Err ${strategy} calculate`, err);
//       reject(err);
//     }
//   });
// };
//
// function createRSIObj(
//   data,
//   i,
//   period,
//   iniGain = 0,
//   iniLoss = 0,
//   previousLine = {}
// ) {
//   var oRSI = {};
//   if (i === 0) return { close: data[0].close };
//   oRSI.close = _.round(data[i].close, 12);
//   oRSI.change = _.round(oRSI.close - data[i - 1].close, 12);
//   oRSI.change >= 0
//     ? ((oRSI.gain = oRSI.change), (oRSI.loss = 0))
//     : ((oRSI.loss = Math.abs(oRSI.change)), (oRSI.gain = 0));
//   if (i >= period) {
//     if (i === period) {
//       oRSI.avgGain = _.round(iniGain / period, 12);
//       oRSI.avgLoss = _.round(iniLoss / period, 12);
//     } else {
//       oRSI.avgGain = (previousLine.avgGain * (period - 1) + oRSI.gain) / period;
//       oRSI.avgGain = _.round(oRSI.avgGain, 12);
//       oRSI.avgLoss = (previousLine.avgLoss * (period - 1) + oRSI.loss) / period;
//       oRSI.avgLoss = _.round(oRSI.avgLoss, 12);
//     }
//     oRSI.rs = _.round(oRSI.avgGain / oRSI.avgLoss, 12);
//     oRSI.avgLoss === 0
//       ? (oRSI.rsi = 100)
//       : (oRSI.rsi = 100 - 100 / (1 + oRSI.rs));
//     oRSI.rsi = _.round(oRSI.rsi, 12);
//   }
//
//   return oRSI;
// }

module.exports = {
  applyBusinessRules: applyBusinessRules,
  getData: getData
};

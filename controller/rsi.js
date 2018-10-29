const moment = require("moment");
const _ = require("lodash");
const fs = require("fs-extra");

("use strict");

var _this = this;
const logFile = "./logs/logRSI.txt";

exports.execute = function(data, params) {
  return new Promise(async function(resolve, reject) {
    try {
      var _params = params.split(",");
      var result = await process_RSI(data, _params);
      resolve(result);
    } catch (err) {
      console.log("Err RSI execute: ", err);
      reject(err);
    }
  });
};

function process_RSI(data, params) {
  return new Promise(async function(resolve, reject) {
    try {
      var rsiData = await calculateRSI(data, params);
      await log(rsiData);
      var top = parseInt(params[1]);
      var bottom = parseInt(params[2]);
      result = await applyBusinessRules(rsiData, top, bottom);
      resolve(result);
    } catch (err) {
      console.log("Err process_SMA: ", err);
      reject(err);
    }
  });
}

function applyBusinessRules(rsiData, top, bottom) {
  return new Promise(async function(resolve, reject) {
    try {
      var objRSI = [{ indic: "RSI", oper: "none", factor: 0, rules: "" }];
      var count = 0;
      var recent = -7;
      var countGains = rsiData.slice(recent).map(function(element) {
        return element.gain > 0 ? count++ : 0;
      });

      var recentGains = rsiData
        .slice(recent)
        .map(function(element) {
          return element.gain;
        })
        .reduce((a, b) => a + b, 0);

      var recentLosses = rsiData
        .slice(recent)
        .map(function(element) {
          return element.loss;
        })
        .reduce((a, b) => a + b, 0);

      if (rsiData.slice(-1)[0].rsi > top) {
        if (recentGains > recentLosses) {
          objRSI[0].oper = "buy";
          objRSI[0].factor = 3;
          objRSI[0].rules = "rsi>70 with recent uptrend";
        } else {
          objRSI[0].oper = "sell";
          objRSI[0].factor = 3;
          objRSI[0].rules = "rsi>70 with recent downtrend";
        }
      }
      if (rsiData.slice(-1)[0].rsi < bottom) {
        if (recentGains < recentLosses) {
          objRSI[0].oper = "sell";
          objRSI[0].factor = 3;
          objRSI[0].rules = "rsi<30 with recent downtrend";
        } else {
          objRSI[0].oper = "buy";
          objRSI[0].factor = 3;
          objRSI[0].rules = "rsi<30 with recent uptrend";
        }
      }
      if (rsiData.slice(-1)[0].rsi > 40 && rsiData.slice(-1)[0].rsi < 60) {
        objRSI[0].oper = "sell";
        objRSI[0].factor = 2;
        objRSI[0].rules = "60>rsi>40";
        if (recentGains > recentLosses && Math.max(...countGains) >= 5) {
          objRSI[0].oper = "buy";
          objRSI[0].factor = 2;
          objRSI[0].rules += " with uptrend";
        }
        if (recentGains < recentLosses && Math.max(...countGains) <= 2) {
          objRSI[0].oper = "sell";
          objRSI[0].factor = 2;
          objRSI[0].rules += " with downtrend";
        }
      }

      resolve(objRSI); //this obj MUST have named properties: oper, factor
    } catch (err) {
      console.log("Err rulesRSI: ", err);
      reject(err);
    }
  });
}

function log(rsiData) {
  return new Promise(async function(resolve, reject) {
    try {
      var outputLines = rsiData.map(function(element) {
        return { close: element.close, rsi: element.rsi || 0 };
      });
      await fs.outputFile(logFile, "rsiData: " + "\r\n");
      await fs.appendFile(logFile, JSON.stringify(outputLines) + "\r\n");
      resolve("OK");
    } catch (err) {
      console.log("Err logRSI: ", err);
      reject(err);
    }
  });
}

const calculateRSI = function(data, params) {
  return new Promise(async function(resolve, reject) {
    try {
      //initial period calc
      period = parseInt(params[0]);
      var iniGain = 0;
      var iniLoss = 0;
      var rsiData = [];
      var oRSI = { close: data[0].close };
      rsiData[0] = oRSI;
      for (var i = 1; i <= period; i++) {
        oRSI = {};
        oRSI = createRSIObj(data, i, period);
        rsiData[i] = oRSI;
        iniGain += oRSI.gain;
        iniLoss += oRSI.loss;
      }
      //first line on period limit
      oRSI = createRSIObj(data, period, period, iniGain, iniLoss);
      rsiData[period] = oRSI;
      // remaining data
      for (var i = period + 1; i < data.length; i++) {
        oRSI = {};
        oRSI = createRSIObj(data, i, period, iniGain, iniLoss, rsiData[i - 1]);
        rsiData[i] = oRSI;
      }
      resolve(rsiData);
    } catch (err) {
      console.log("Err calculate_RSI: ", err);
      reject(err);
    }
  });
};

function createRSIObj(
  data,
  i,
  period,
  iniGain = 0,
  iniLoss = 0,
  previousLine = {}
) {
  var oRSI = {};
  if (i === 0) return { close: data[0].close };
  oRSI.close = _.round(data[i].close, 12);
  oRSI.change = _.round(oRSI.close - data[i - 1].close, 12);
  oRSI.change >= 0
    ? ((oRSI.gain = oRSI.change), (oRSI.loss = 0))
    : ((oRSI.loss = Math.abs(oRSI.change)), (oRSI.gain = 0));
  if (i >= period) {
    if (i === period) {
      oRSI.avgGain = _.round(iniGain / period, 12);
      oRSI.avgLoss = _.round(iniLoss / period, 12);
    } else {
      oRSI.avgGain = (previousLine.avgGain * (period - 1) + oRSI.gain) / period;
      oRSI.avgGain = _.round(oRSI.avgGain, 12);
      oRSI.avgLoss = (previousLine.avgLoss * (period - 1) + oRSI.loss) / period;
      oRSI.avgLoss = _.round(oRSI.avgLoss, 12);
    }
    oRSI.rs = _.round(oRSI.avgGain / oRSI.avgLoss, 12);
    oRSI.avgLoss === 0
      ? (oRSI.rsi = 100)
      : (oRSI.rsi = 100 - 100 / (1 + oRSI.rs));
    oRSI.rsi = _.round(oRSI.rsi, 12);
  }

  return oRSI;
}

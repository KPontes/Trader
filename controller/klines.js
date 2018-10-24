const moment = require("moment");
const _ = require("lodash");
const fs = require("fs-extra");

("use strict");

var _this = this;

const tradeFile = "./logs/tradeklines.txt";

exports.execute = function(data, pair, params = "") {
  return new Promise(async function(resolve, reject) {
    try {
      var result = await process_KL(data, params);
      resolve(result);
    } catch (err) {
      console.log("Err movingAvg execute: ", err);
      reject(err);
    }
  });
};

function process_KL(data, params) {
  return new Promise(async function(resolve, reject) {
    try {
      var kDirection = [0, 0]; //stores ups and downs for last two groups of candles
      var kLines = data.slice(-7, -4);
      for (var i = 0; i < kLines.length; i++) {
        kLines[i].close >= kLines[i].open
          ? (kDirection[0] += 1)
          : (kDirection[0] -= 1);
      }
      var kLines = data.slice(-3);
      for (var i = 0; i < kLines.length; i++) {
        kLines[i].close >= kLines[i].open
          ? (kDirection[1] += 1)
          : (kDirection[1] -= 1);
      }
      var groupVariation = (kLines[2].close - kLines[0].open) / kLines[0].open;
      var candleVariation = (kLines[2].close - kLines[2].open) / kLines[2].open;

      objKLines = await applyBusinessRules(
        kDirection,
        groupVariation,
        candleVariation
      );
      await log(data, objKLines);
      resolve(objKLines);
    } catch (err) {
      console.log("Err process_KL: ", err);
      reject(err);
    }
  });
}

function applyBusinessRules(kDirection, groupVariation, candleVariation) {
  return new Promise(async function(resolve, reject) {
    try {
      //this obj MUST have two properties, namely: oper, factor
      var objKLines = {};
      var factor = []; //stores factor for each rule
      var rules = []; //store business rules that match recent data
      //treat magnitude of group and last candle variation
      switch (true) {
        case groupVariation > 0.002 || candleVariation > 0.002:
          rules[0] = "large variation";
          oper = "buy";
          factor[0] = 4;
          break;
        case groupVariation < -0.002 || candleVariation < -0.002:
          rules[0] = "large variation";
          oper = "sell";
          factor[0] = 4;
          break;
        case groupVariation > 0 || candleVariation > 0:
          rules[0] = "small variation";
          oper = "buy";
          factor[0] = 1;
          break;
        default:
          rules[0] = "small variation";
          oper = "sell";
          factor[0] = 1;
          break;
      }
      //keeps the sum of up/down of last three candles.
      //If all in the same kDirection indicates strong trend
      switch (Math.abs(kDirection[1])) {
        case 1: //2 onde direction minus one other direction
          rules[1] = "same 2 directions";
          factor[1] = 1;
          break;
        case 3:
          rules[1] = "same 3 directions";
          factor[1] = 4;
          break;
        default:
          rules[1] = "same 2 directions";
          factor[1] = 1;
          break;
      }
      //ultimos 5 candles positivos e atual negativo. Inversão forte de tendencia
      if (kDirection[0] + kDirection[1] >= 5 && oper === "sell") {
        rules[2] = "uptrend inversion";
        factor[2] = 4;
      }
      //ultimos 5 candles negativos e atual positivo. Inversão forte de tendencia
      if (kDirection[0] + kDirection[1] <= -5 && oper === "buy") {
        rules[2] = "downtrend inversion";
        factor[2] = 4;
      }
      objKLines.oper = oper;
      objKLines.factor = Math.max(...factor);
      objKLines.rule = rules.join(" / ");
      resolve(objKLines);
    } catch (err) {
      console.log("Err logKL: ", err);
      reject(err);
    }
  });
}

function log(data, objKLines) {
  return new Promise(async function(resolve, reject) {
    try {
      var line =
        objKLines.oper +
        " , " +
        objKLines.factor.toString() +
        " , " +
        objKLines.rule +
        " , " +
        moment(data.slice(-1)[0].closeTime).format("YYYYMMDDHHmmss") +
        " , " +
        data.slice(-1)[0].close;
      //console.log(line);
      await fs.appendFile(tradeFile, line + "\r\n");
      resolve("OK");
    } catch (err) {
      console.log("Err logMA: ", err);
      reject(err);
    }
  });
}

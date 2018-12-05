const moment = require("moment");
const _ = require("lodash");
const fs = require("fs-extra");

const modelUsers = require("../models/juser");

("use strict");

var _this = this;

const tradeFile = "./logs/tradeklines.txt";
const strategy = "KLines";
var users = {};

exports.execute = function(data) {
  return new Promise(async function(resolve, reject) {
    try {
      users = await modelUsers.getUsers();
      var result = await process(data);
      resolve(result);
    } catch (err) {
      console.log(`Err ${strategy} execute`, err);
      reject(err);
    }
  });
};

function process(data) {
  return new Promise(async function(resolve, reject) {
    try {
      var kDirection = []; //stores ups and downs for last two groups of 4 candles
      var kLines = data.slice(-8);
      for (var i = 0; i < kLines.length; i++) {
        kLines[i].close >= kLines[i].open
          ? (kDirection[i] = 1)
          : (kDirection[i] = -1);
      }

      var groupVariation = (kLines[3].close - kLines[0].open) / kLines[0].open;
      var candleVariation = (kLines[3].close - kLines[3].open) / kLines[3].open;

      objKLines = await applyBusinessRules(
        kDirection,
        groupVariation,
        candleVariation
      );
      //await log(data, objKLines);
      resolve(objKLines);
    } catch (err) {
      console.log(`Err ${strategy} process`, err);
      reject(err);
    }
  });
}

function applyBusinessRules(kDirection, groupVariation, candleVariation) {
  return new Promise(async function(resolve, reject) {
    try {
      //this obj MUST have two properties, namely: oper, factor
      var objKLines = [];
      var obj = {};
      const variation = users[0].pairs[0].minVariation;
      obj = variationRules(variation, candleVariation, groupVariation);
      if (obj.oper && obj.factor) objKLines.push(obj);
      obj = directionRules(kDirection);
      if (obj.oper && obj.factor) objKLines.push(obj);
      obj = trendInversionRules(kDirection);
      if (obj.oper && obj.factor) objKLines.push(obj);

      resolve(objKLines);
    } catch (err) {
      console.log(`Err ${strategy} rules`, err);
      reject(err);
    }
  });
}

function variationRules(variation, candleVariation, groupVariation) {
  //treat magnitude of group and last candle variation
  var obj = { indic: "KLines" };
  switch (true) {
    //case groupVariation > variation || candleVariation > variation:
    case groupVariation > variation:
      obj.rules = "large variation";
      obj.oper = "buy";
      obj.factor = 4;
      break;
    case groupVariation < -variation:
      obj.rules = "large variation";
      obj.oper = "sell";
      obj.factor = 4;
      break;
    case groupVariation > 0 || candleVariation > 0:
      obj.rules = "small variation";
      obj.oper = "none";
      obj.factor = 0;
      break;
    default:
      obj.rules = "small variation";
      obj.oper = "none";
      obj.factor = 0;
      break;
  }
  return obj;
}

function directionRules(kDirection) {
  //keeps the sum of up/down of last four candles.
  //If all in the same kDirection indicates strong trend
  var obj = { indic: "KLines" };
  const reducer = (accumulator, currentValue) => accumulator + currentValue;
  switch (kDirection.slice(-4).reduce(reducer)) {
    case 4:
      obj.oper = "buy";
      obj.rules = "same 4 up dir";
      obj.factor = 4;
      break;
    case -4:
      obj.oper = "sell";
      obj.rules = "same 4 down dir";
      obj.factor = 4;
      break;
    default:
      obj.oper = "none";
      obj.rules = "mixed directions";
      obj.factor = 0;
      break;
  }
  return obj;
}

function trendInversionRules(kDirection) {
  //ultimos 7 candles positivos e atual negativo. Inversão forte de tendencia
  obj = {};
  const reducer = (accumulator, currentValue) => accumulator + currentValue;
  if (
    kDirection.slice(0, 7).reduce(reducer) === 7 &&
    kDirection.slice(-1) === -1
  ) {
    obj.indic = "KLines";
    obj.oper = "sell";
    obj.rules = "inversion to downtrend";
    obj.factor = 4;
  }
  //ultimos 7 candles negativos e atual positivo. Inversão forte de tendencia
  if (
    kDirection.slice(0, 7).reduce(reducer) === -7 &&
    kDirection.slice(-1) === 1
  ) {
    obj.indic = "KLines";
    obj.oper = "buy";
    obj.rules = "inversion to uptrend";
    obj.factor = 4;
  }
  return obj;
}

function log(data, objKLines) {
  return new Promise(async function(resolve, reject) {
    try {
      //PRECISA TRATAR CADA LINHA DE OBJ
      var line =
        objKLines[0].oper +
        " , " +
        objKLines[0].factor.toString() +
        " , " +
        objKLines[0].rule +
        " , " +
        moment(data.slice(-1)[0].closeTime).format("YYYYMMDD:HHmmss") +
        " , " +
        data.slice(-1)[0].close;
      //console.log(line);
      await fs.appendFile(tradeFile, line + "\r\n");
      resolve("OK");
    } catch (err) {
      console.log(`Err ${strategy} log`, err);
      reject(err);
    }
  });
}

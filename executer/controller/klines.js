const { ILoader } = require("../models/indicatorLoader.js");

("use strict");

const strategy = "KLines";

function getData(exchange, symbol, period) {
  return new Promise(async function(resolve, reject) {
    try {
      var arr = await ILoader.findOne({
        exchange,
        symbol,
        period,
        name: "KLines"
      });
      resolve(arr);
    } catch (err) {
      console.log(`Err ${strategy} getData:`, err);
      reject(err);
    }
  });
}

function applyBusinessRules(data, variation) {
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

      var objKLines = [];
      var obj = {};
      obj = variationRules(variation, candleVariation, groupVariation);
      if (obj.oper && obj.factor) objKLines.push(obj);
      obj = directionRules(kDirection);
      if (obj.oper && obj.factor) objKLines.push(obj);
      obj = trendInversionRules(kDirection);
      if (obj.oper && obj.factor) objKLines.push(obj);
      if (objKLines.length === 0) {
        objKLines = [{ indic: "KLines", oper: "none", factor: 0, rules: "" }];
      }
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
      obj.factor = 3;
      break;
    case groupVariation < -variation:
      obj.rules = "large variation";
      obj.oper = "sell";
      obj.factor = 3;
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
      obj.factor = 3;
      break;
    case -4:
      obj.oper = "sell";
      obj.rules = "same 4 down dir";
      obj.factor = 3;
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
    kDirection.slice(-1)[0] === -1
  ) {
    obj.indic = "KLines";
    obj.oper = "sell";
    obj.rules = "inversion to downtrend";
    obj.factor = 2;
  }
  //ultimos 7 candles negativos e atual positivo. Inversão forte de tendencia
  if (
    kDirection.slice(0, 7).reduce(reducer) === -7 &&
    kDirection.slice(-1)[0] === 1
  ) {
    obj.indic = "KLines";
    obj.oper = "buy";
    obj.rules = "inversion to uptrend";
    obj.factor = 2;
  }
  return obj;
}

module.exports = {
  applyBusinessRules: applyBusinessRules,
  getData: getData
};

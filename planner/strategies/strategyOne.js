const { Signalizer } = require("../models/signalizer.js");
const mavg = require("../controller/movingAvg.js");
const rsi = require("../controller/rsi.js");
const bbands = require("../controller/bbands.js");
const macd = require("../controller/macd.js");
const klines = require("../controller/klines.js");
const strategy = require("../controller/strategy.js");

("use strict");

const strategyName = "StrategyOne";

module.exports = StrategyOne;

function StrategyOne(params) {
  //config params must be always in array format
  this.config = {
    sma: [4, 7, 25, 99],
    rsi: [14, 30, 70, 7],
    bbands: [20, 100],
    macd: [12, 26, 9],
    klines: [0.005]
  };
}

function findDocs(arr, value) {
  let result = arr.find(function(element) {
    if (parseInt(element.params) === value) {
      return element.data;
    }
  });
  return result ? result.data : undefined;
}

StrategyOne.prototype.generate = function(exchange, pair, period) {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      await Signalizer.upsert(strategyName, "loading");
      //await Strategy.deleteMany({ name: "strategyOne" });
      const SMA = await _this.processSMA(exchange, pair, period);
      const RSI = await _this.processRSI(exchange, pair, period);
      const BBANDS = await _this.processBBands(exchange, pair, period);
      const MACD = await _this.processMACD(exchange, pair, period);
      const KLINES = await _this.processKLines(exchange, pair, period);
      const result = SMA.concat(RSI)
        .concat(BBANDS)
        .concat(MACD)
        .concat(KLINES);
      const summary = await _this.summarize(exchange, pair, period, result);
      await strategy.saveResult(
        strategyName,
        exchange,
        pair,
        period,
        _this.config,
        result,
        summary
      );
      await Signalizer.upsert(strategyName, "ready");
      console.log(result);
      console.log(summary);
      console.log("OK generate " + strategyName);
      resolve("OK " + strategyName);
    } catch (err) {
      console.log("Err generate: ", err);
      reject(err);
    }
  });
};

StrategyOne.prototype.summarize = function(exchange, pair, period, lastResult) {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      summary = {
        countBuy: 0,
        countSell: 0,
        countNone: 0,
        factorBuy: 0,
        factorSell: 0,
        factorNone: 0
      };
      lastResult.map(element => {
        switch (element.oper) {
          case "buy":
            summary.countBuy += 1;
            summary.factorBuy += element.factor;
            break;
          case "sell":
            summary.countSell += 1;
            summary.factorSell += element.factor;
            break;
          default:
            summary.countNone += 1;
            summary.factorNone += element.factor;
            break;
        }
      });
      resolve(summary);
    } catch (err) {
      console.log(`Err ${strategyName} summarize:`, err);
      reject(err);
    }
  });
};

StrategyOne.prototype.processSMA = function(exchange, pair, period) {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      const arr = await mavg.getData(exchange, pair, period);
      const xShortMA = findDocs(arr.docs, _this.config.sma[0]);
      const shortMA = findDocs(arr.docs, _this.config.sma[1]);
      const mediumMA = findDocs(arr.docs, _this.config.sma[2]);
      const longMA = findDocs(arr.docs, _this.config.sma[3]);
      if (!xShortMA || !shortMA || !mediumMA || !longMA) {
        throw "Configured MA params not found on load";
      }
      var obj = [];
      obj[0] = mavg.applyCrossingLines(shortMA, mediumMA, longMA);
      obj[1] = mavg.applyTrend(xShortMA);
      resolve(obj); //this obj MUST have named properties: oper, factor
    } catch (err) {
      console.log(`Err ${strategyName} processSMA:`, err);
      reject(err);
    }
  });
};

StrategyOne.prototype.processRSI = function(exchange, pair, period) {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      const arr = await rsi.getData(exchange, pair, period);
      const searchData = findDocs(arr.docs, _this.config.rsi[0]);
      if (!searchData) {
        throw "Configured RSI params not found on load";
      }
      const result = await rsi.applyBusinessRules(
        searchData,
        _this.config.rsi[1],
        _this.config.rsi[2],
        _this.config.rsi[3]
      );
      resolve(result);
    } catch (err) {
      console.log(`Err ${strategyName} processRSI:`, err);
      reject(err);
    }
  });
};

StrategyOne.prototype.processBBands = function(exchange, pair, period) {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      const arr = await bbands.getData(exchange, pair, period);
      const searchData = findDocs(arr.docs, _this.config.bbands[0]);
      if (!searchData) {
        throw "Configured BBANDS params not found on load";
      }
      const result = await bbands.applyBusinessRules(
        searchData,
        _this.config.bbands[1]
      );
      resolve(result);
    } catch (err) {
      console.log(`Err ${strategyName} processBBands:`, err);
      reject(err);
    }
  });
};

StrategyOne.prototype.processMACD = function(exchange, pair, period) {
  var _this = this;

  function findDocsMACD(arr, value) {
    //macd params is a comma separated string
    let result = arr.find(function(element) {
      if (element.params === value) {
        return element.data;
      }
    });
    return result ? result.data : undefined;
  }
  return new Promise(async function(resolve, reject) {
    try {
      const arr = await macd.getData(exchange, pair, period);
      const searchParam = _this.config.macd.join(",");
      const searchData = findDocsMACD(arr.docs, searchParam);
      if (!searchData) {
        throw "Configured MACD params not found on load";
      }
      const result = await macd.applyBusinessRules(searchData[0]);
      resolve(result);
    } catch (err) {
      console.log(`Err ${strategyName} processMACD:`, err);
      reject(err);
    }
  });
};

StrategyOne.prototype.processKLines = function(exchange, pair, period) {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      const arr = await klines.getData(exchange, pair, period);
      //unique fixed search parameter as klines dont change with parameters
      const searchData = findDocs(arr.docs, 1);
      if (!searchData) {
        throw "Configured KLINES params not found on load";
      }
      const result = await klines.applyBusinessRules(
        searchData,
        _this.config.klines[0]
      );
      resolve(result);
    } catch (err) {
      console.log(`Err ${strategyName} processKlines:`, err);
      reject(err);
    }
  });
};

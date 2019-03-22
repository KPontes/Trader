const moment = require("moment");
const _ = require("lodash");

const mavg = require("../controller/movingAvg.js");
const rsi = require("../controller/rsi.js");
const bbands = require("../controller/bbands.js");
const macd = require("../controller/macd.js");
const klines = require("../controller/klines.js");
const strategy = require("../controller/strategy.js");
const { Strategy } = require("../models/strategy.js");

("use strict");

const strategyName = "StrategyOne";

module.exports = StrategyOne;

function StrategyOne(config) {
  //config params must be always in array format
  this.config = config;
}

function findDocs(arr, value) {
  let result = arr.find(function(element) {
    if (parseInt(element.params) === value) {
      return element.data;
    }
  });
  return result ? result.data : undefined;
}

StrategyOne.prototype.obtainResult = function(exchange, symbol, period) {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      const SMA = await _this.processSMA(exchange, symbol, period);
      const RSI = await _this.processRSI(exchange, symbol, period);
      const BBANDS = await _this.processBBands(exchange, symbol, period);
      const MACD = await _this.processMACD(exchange, symbol, period);
      const KLINES = await _this.processKLines(exchange, symbol, period);
      const result = SMA.concat(RSI)
        .concat(BBANDS)
        .concat(MACD)
        .concat(KLINES);
      const summary = await _this.summarize(result);
      resolve({ result, summary });
    } catch (err) {
      console.log("Err update StrategyOne: ", err);
      reject(err);
    }
  });
};

StrategyOne.prototype.summarize = function(lastResult) {
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
      if (!arr.docs || arr.docs.length === 0) {
        throw "Err missing iloader SMA docs";
      }
      const xShortMA = findDocs(arr.docs, _this.config.calc.sma[0]);
      const shortMA = findDocs(arr.docs, _this.config.calc.sma[1]);
      const mediumMA = findDocs(arr.docs, _this.config.calc.sma[2]);
      const longMA = findDocs(arr.docs, _this.config.calc.sma[3]);
      if (!xShortMA || !shortMA || !mediumMA || !longMA) {
        throw "Configured MA params not found on load";
      }
      var obj = [];
      obj[0] = mavg.applyCrossingLines(shortMA, mediumMA, longMA);
      obj[1] = mavg.applyTrend(xShortMA, _this.config.rule.sma[0]);
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
      const searchData = findDocs(arr.docs, _this.config.calc.rsi[0]);
      if (!searchData) {
        throw "Err missing iloader RSI docs";
      }
      const result = await rsi.applyBusinessRules(
        searchData,
        _this.config.rule.rsi[0],
        _this.config.rule.rsi[1],
        _this.config.rule.rsi[2]
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
      const searchData = findDocs(arr.docs, _this.config.calc.bbands[0]);
      if (!searchData) {
        throw "Err missing iloader BBands docs";
      }
      const result = await bbands.applyBusinessRules(searchData, _this.config.rule.bbands[0]);
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
    //macd params at iLoader is a comma separated string
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
      const searchParam = _this.config.calc.macd.join(",");
      const searchData = findDocsMACD(arr.docs, searchParam);
      if (!searchData) {
        throw "Err missing iloader MACD docs";
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
        throw "Err missing iloader KLINES docs";
      }
      const result = await klines.applyBusinessRules(searchData, _this.config.rule.klines[0]);
      resolve(result);
    } catch (err) {
      console.log(`Err ${strategyName} processKlines:`, err);
      reject(err);
    }
  });
};

// this.config = {
//   calc: {
//     sma: [4, 7, 25, 99],
//     rsi: [14],
//     bbands: [20],
//     macd: [12, 26, 9],
//     klines: [1]
//   },
//   rule: {
//     sma: [],
//     rsi: [30, 70, 7],
//     bbands: [100],
//     macd: [],
//     klines: [0.005]
//   }
// };

// StrategyOne.prototype.findResult = function(exchange, symbol, period) {
//   var _this = this;
//   return new Promise(async function(resolve, reject) {
//     try {
//       //Find if config passed on constructor exists on collection Strategy
//       var stgList = await Strategy.find({ name: strategyName, exchange, symbol, period });
//       let stg;
//       let match;
//       for (let doc of stgList) {
//         match = true;
//         Object.keys(_this.config.calc).forEach(key => {
//           let cfgCalcInput = _this.config.calc[key];
//           let cfgCalcDb = doc.configcalc[key];
//           if (cfgCalcDb.length !== cfgCalcInput.length) match = false;
//           cfgCalcInput.map(item => {
//             //if thete is an input item without match on db
//             if (_.indexOf(cfgCalcDb, item) === -1) {
//               match = false;
//             }
//           });
//         });
//         Object.keys(_this.config.rule).forEach(key => {
//           let cfgRuleInput = _this.config.rule[key];
//           let cfgRuleDb = doc.configrule[key];
//           if (cfgRuleDb.length !== cfgRuleInput.length) match = false;
//           cfgRuleInput.map(item => {
//             if (_.indexOf(cfgRuleDb, item) === -1) {
//               match = false;
//             }
//           });
//         });
//         if (match) {
//           stg = doc;
//           break;
//         }
//       }
//       if (!match) {
//         return resolve({ stgdoc: false, action: "insert" });
//       }
//       if (!(stg.lastresult && stg.lastsummary)) {
//         return resolve({ stgdoc: stg, action: "update" });
//       }
//       if (moment().subtract(1, "minutes") > stg.updatedAt) {
//         return resolve({ stgdoc: stg, action: "update" });
//       }
//       resolve({ stgdoc: stg, action: "none" });
//     } catch (err) {
//       console.log("Err generate: ", err);
//       reject(err);
//     }
//   });
// };

// StrategyOne.prototype.createConfig = function(exchange, pair, period) {
//   var _this = this;
//   return new Promise(async function(resolve, reject) {
//     try {
//       let newStrategy = {
//         name: strategyName,
//         exchange,
//         pair,
//         period
//       };
//       //transform config into an input like the postman request
//       Object.keys(_this.config.calc).forEach(key => {
//         let newkey = "calc-" + key;
//         newStrategy[newkey] = _this.config.calc[key];
//       });
//       Object.keys(_this.config.rule).forEach(key => {
//         let newkey = "rule-" + key;
//         newStrategy[newkey] = _this.config.rule[key];
//       });
//       let stg = await strategy.saveConfig(newStrategy);
//       resolve({ stgdoc: stg, action: "update" });
//     } catch (err) {
//       console.log("Err update StrategyOne: ", err);
//       reject(err);
//     }
//   });
// };

const intervalObj = require("interval-promise");
const moment = require("moment");
const fs = require("fs-extra");

const { ILoader } = require("../models/indicatorLoader.js");
const { Indicator } = require("../models/indicator.js");
const { Signalizer } = require("../models/signalizer.js");
const mavg = require("../controller/movingAvg.js");
const rsi = require("../controller/rsi.js");

("use strict");

const strategy = "strategyOne";

module.exports = StrategyOne;

function StrategyOne(params) {
  this.config = {
    sma: [4, 7, 25, 99],
    rsi: [14, 30, 70, 50]
  };
}

StrategyOne.prototype.generate = function(exchange, pair, period) {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      let result = [];
      await Signalizer.upsert("strategy01", "loading");
      //await Strategy.deleteMany({ name: "strategyOne" });
      const SMA = await _this.processSMA(exchange, pair, period);
      const RSI = await _this.processRSI(exchange, pair, period);

      console.log(SMA.concat(RSI));
      await Signalizer.upsert("strategy01", "ready");
      console.log("OK strat01 generate");
      resolve("OK strategyOne");
    } catch (err) {
      console.log("Err generate: ", err);
      reject(err);
    }
  });
};

StrategyOne.prototype.processSMA = function(exchange, pair, period) {
  var _this = this;
  function findSMA(arr, value) {
    let result = arr.docs.find(function(element) {
      if (parseInt(element.params) === value) {
        return element.data;
      }
    });
    return result.data || undefined;
  }
  return new Promise(async function(resolve, reject) {
    try {
      const arr = await mavg.getData(exchange, pair, period);
      const xShortMA = findSMA(arr, _this.config.sma[0]);
      const shortMA = findSMA(arr, _this.config.sma[1]);
      const mediumMA = findSMA(arr, _this.config.sma[2]);
      const longMA = findSMA(arr, _this.config.sma[3]);
      if (!xShortMA || !shortMA || !mediumMA || !longMA) {
        throw "Configured MA params not found on load";
      }
      var obj = [];
      obj[0] = mavg.applyCrossingLines(shortMA, mediumMA, longMA);
      obj[1] = mavg.applyTrend(xShortMA);
      resolve(obj); //this obj MUST have named properties: oper, factor
    } catch (err) {
      console.log(`Err ${strategy} processSMA:`, err);
      reject(err);
    }
  });
};

StrategyOne.prototype.processRSI = function(exchange, pair, period) {
  var _this = this;
  function findRSI(arr, value) {
    let result = arr.docs.find(function(element) {
      if (parseInt(element.params) === value) {
        return element.data;
      }
    });
    return result.data || undefined;
  }
  return new Promise(async function(resolve, reject) {
    try {
      const arr = await rsi.getData(exchange, pair, period);
      const rsiData = findRSI(arr, _this.config.rsi[0]);
      if (!rsiData) {
        throw "Configured RSI params not found on load";
      }
      const result = await rsi.applyBusinessRules(
        rsiData,
        _this.config.sma[1],
        _this.config.sma[2],
        _this.config.sma[3]
      );
      resolve(result);
    } catch (err) {
      console.log(`Err ${strategy} processRSI:`, err);
      reject(err);
    }
  });
};

// StrategyOne.prototype.generateIndicators = function(_exchg, _pair, _candles, _per) {
//   var _this = this;
//   return new Promise(async function(resolve, reject) {
//     try {
//       let loader = {
//         sma: [],
//         ema: [],
//         rsi: [],
//         macd: [],
//         bbands: [],
//         klines: []
//       };
//       const arr = _candles.map(item => item.close);
//       indicators = await Indicator.find({ period: _per });
//       for (let it of indicators) {
//         if (it.name === "SMA" || it.name === "EMA") {
//           for (let value of it.params) {
//             var newItem = await _this.generateMAdata(it.name, arr, value);
//             it.name === "SMA"
//               ? loader.sma.push(newItem)
//               : loader.ema.push(newItem);
//           }
//         }
//         if (it.name === "KLines") {
//           loader.klines.data = _candles;
//         }
//         if (it.name === "RSI") {
//           for (let value of it.params) {
//             var newItem = await _this.generateRSIdata(_candles, value);
//             loader.rsi.push(newItem);
//           }
//         }
//         if (it.name === "MACD") {
//           let cont = 0; //macd uses groups of 3 params for calculation
//           for (let value of it.params) {
//             cont += 1;
//             if (cont % 3 === 0) {
//               let params = it.params.slice(cont - 3, cont);
//               var newItem = await _this.generateMACDdata(_candles, params);
//               loader.macd.push(newItem);
//             }
//           }
//         }
//         if (it.name === "BBANDS") {
//           for (let value of it.params) {
//             var newItem = await _this.generateBBandsData(_candles, value);
//             loader.bbands.push(newItem);
//           }
//         }
//         await ctrIndicators.saveLoad(_exchg, _pair, _per, it.name, loader);
//       }
//
//       // newLoad = await ctrIndicators.saveLoad(_exchange, _pair, _period, loader);
//       resolve("OK");
//     } catch (err) {
//       console.log("Err generateIndicators: ", err);
//       reject(err);
//     }
//   });
// };

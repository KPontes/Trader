const intervalObj = require("interval-promise");
const moment = require("moment");
const fs = require("fs-extra");

const { ILoader } = require("../models/indicatorLoader.js");
const { Indicator } = require("../models/indicator.js");
const { Signalizer } = require("../models/signalizer.js");
const StrategyOne = require("../strategies/strategyOne.js");

("use strict");

const logFile = "./logs/generalErrLog.txt";

module.exports = Monitor;

function Monitor(interval) {
  this.interval = interval;
  this.stopExecute = false;
}

Monitor.prototype.pooling = async function() {
  var _this = this;
  intervalObj(
    async (iteration, stop) => {
      try {
        if (_this.stopExecute) {
          console.log("Stop executeTrade loop");
          stop();
        }
        var result = await _this.executeLoader();
      } catch (err) {
        console.log("Err poolingMonitor", err.message);
        logErr(err);
        //_this.stopExecute = true;
      }
    },
    _this.interval,
    (options = { stopOnError: true })
  );
};

Monitor.prototype.execute = function() {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      var signal = await Signalizer.findOne({ name: "status" });
      if (!signal || signal.value === "loading") {
        throw "No signalizer or loading";
      }
      const timer = ["1m"];
      const exchanges = ["binance"];
      //const pairs = ["XRPUSDT", "ETHUSDT", "BTCUSDT"];
      const pairs = ["XRPUSDT"];
      for (let pair of pairs) {
        for (let time of timer) {
          var strategyOne = new StrategyOne();
          await strategyOne.generate(exchanges[0], pair, time);
        }
      }
      await Signalizer.upsert("status", "ready");

      console.log("OK executePlanner");
      resolve("OK");
    } catch (err) {
      console.log("Err executePlanner: ", err);
      reject(err);
    }
  });
};

// Monitor.prototype.generateIndicators = function(_exchg, _pair, _candles, _per) {
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

Monitor.prototype.stop = function() {
  this.stopExecute = true;
  return "OK";
};

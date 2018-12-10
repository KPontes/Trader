const intervalObj = require("interval-promise");
const moment = require("moment");
const fs = require("fs-extra");

const { ILoader } = require("../models/indicatorLoader.js");
const { Indicator } = require("../models/indicator.js");
const { Signalizer } = require("../models/signalizer.js");
const exchange = require("./exchange.js");
const mavg = require("./movingAvg.js");
const rsi = require("./rsi.js");
const bbands = require("./bbands.js");
const macd = require("./macd.js");
const ctrIndicators = require("./indicators.js");

("use strict");

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
        console.log("Err loader pooling", err.message);
        logErr(err);
        //_this.stopExecute = true;
      }
    },
    _this.interval,
    (options = { stopOnError: true })
  );
};

Monitor.prototype.executeLoader = function() {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      await Signalizer.upsert("status", "loading");
      //await iLoader.collection.drop();
      await ILoader.deleteMany();
      const timer = ["1m", "1h"];
      const exchanges = ["binance"];
      //const pairs = ["XRPUSDT", "ETHUSDT", "BTCUSDT"];
      const pairs = ["XRPUSDT"];
      for (let pair of pairs) {
        for (let time of timer) {
          let data = await exchange.getKLines(exchanges[0], pair, time);
          if (data.length < 499) throw { code: 300, msg: "no data" };
          if (data.code) {
            console.log("Err executeLoader", data.message); //returned an error object
            throw data.message;
          }
          await _this.generateIndicators(exchanges[0], pair, data, time);
        }
      }
      await Signalizer.upsert("status", "ready");

      console.log("OK executeLoader " + moment().format("YYYYMMDD:HHmmss"));
      resolve("OK executeLoader");
    } catch (err) {
      console.log("Err executeLoader: ", err);
      reject(err);
    }
  });
};

Monitor.prototype.generateIndicators = function(_exchg, _pair, _candles, _per) {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      let loader = {
        sma: [],
        ema: [],
        rsi: [],
        macd: [],
        bbands: [],
        klines: []
      };
      const arr = _candles.map(item => item.close);
      indicators = await Indicator.find({ period: _per });
      for (let it of indicators) {
        if (it.name === "SMA" || it.name === "EMA") {
          for (let value of it.params) {
            var newItem = await _this.generateMAdata(it.name, arr, value);
            it.name === "SMA"
              ? loader.sma.push(newItem)
              : loader.ema.push(newItem);
          }
        }
        if (it.name === "KLines") {
          loader.klines.data = _candles;
        }
        if (it.name === "RSI") {
          for (let value of it.params) {
            var newItem = await _this.generateRSIdata(_candles, value);
            loader.rsi.push(newItem);
          }
        }
        if (it.name === "MACD") {
          let cont = 0; //macd uses groups of 3 params for calculation
          for (let value of it.params) {
            cont += 1;
            if (cont % 3 === 0) {
              let params = it.params.slice(cont - 3, cont);
              var newItem = await _this.generateMACDdata(_candles, params);
              loader.macd.push(newItem);
            }
          }
        }
        if (it.name === "BBANDS") {
          for (let value of it.params) {
            var newItem = await _this.generateBBandsData(_candles, value);
            loader.bbands.push(newItem);
          }
        }
        await ctrIndicators.saveLoad(_exchg, _pair, _per, it.name, loader);
      }

      // newLoad = await ctrIndicators.saveLoad(_exchange, _pair, _period, loader);
      resolve("OK");
    } catch (err) {
      console.log("Err generateIndicators: ", err);
      reject(err);
    }
  });
};

Monitor.prototype.generateMAdata = function(name, arr, value) {
  return new Promise(async function(resolve, reject) {
    try {
      var newItem = [];
      newItem.params = value;
      if ((name = "SMA")) {
        newItem.data = await mavg.calculateSMA(arr, parseInt(value));
      } else {
        newItem.data = await mavg.calculateEMA(arr, parseInt(value));
      }
      resolve(newItem);
    } catch (err) {
      console.log("Err generateMAdata: ", err);
      reject(err);
    }
  });
};

Monitor.prototype.generateRSIdata = function(data, value) {
  return new Promise(async function(resolve, reject) {
    try {
      var newItem = [];
      newItem.params = value;
      newItem.data = await rsi.calculate(data, parseInt(value));
      resolve(newItem);
    } catch (err) {
      console.log("Err generateRSIdata: ", err);
      reject(err);
    }
  });
};

Monitor.prototype.generateMACDdata = function(data, params) {
  return new Promise(async function(resolve, reject) {
    try {
      var newItem = [];
      newItem.params = params;
      newItem.data = await macd.calculate(
        data,
        parseInt(params[0]),
        parseInt(params[1]),
        parseInt(params[2])
      );
      resolve(newItem);
    } catch (err) {
      console.log("Err generateMACDdata: ", err);
      reject(err);
    }
  });
};

Monitor.prototype.generateBBandsData = function(data, value) {
  return new Promise(async function(resolve, reject) {
    try {
      var newItem = [];
      newItem.params = value;
      newItem.data = await bbands.calculate(data, parseInt(value));
      resolve(newItem);
    } catch (err) {
      console.log("Err generateBBandsdata: ", err);
      reject(err);
    }
  });
};

Monitor.prototype.stop = function() {
  this.stopExecute = true;
  return "OK";
};

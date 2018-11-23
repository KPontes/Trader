const intervalObj = require("interval-promise");
const moment = require("moment");
const fs = require("fs-extra");

const { Indicator } = require("../models/indicator.js");
const { IndicatorLoader } = require("../models/indicatorLoader.js");
const exchange = require("./exchange.js");
const mavg = require("./movingAvg.js");
const rsi = require("./rsi.js");
const bbands = require("./bbands.js");
const macd = require("./macd.js");
const klines = require("./klines.js");
const ctrIndicators = require("./indicators.js");

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

Monitor.prototype.executeLoader = function() {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      //await IndicatorLoader.collection.drop();
      await IndicatorLoader.deleteMany();
      const timer = ["1m", "1h"];
      const exchanges = ["binance"];
      const pairs = ["XRPUSDT", "ETHUSDT", "BTCUSDT"];
      for (let pair of pairs) {
        for (let tmp of timer) {
          let data = await exchange.getKLines(exchanges[0], pair, tmp);
          if (data.length < 499) throw { code: 300, msg: "no data" };
          if (data.code) {
            console.log("Err executeLoader", data.message); //returned an error object
            throw data.message;
          }
          await _this.generateIndicators(exchanges[0], pair, data, tmp);
        }
      }
      console.log("OK executeLoader");
      resolve("OK executeLoader");
    } catch (err) {
      console.log("Err executeLoader: ", err);
      reject(err);
    }
  });
};

Monitor.prototype.generateIndicators = function(
  _exchange,
  _pair,
  _lastData,
  _period
) {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      var loader = {
        sma: [],
        ema: [],
        rsi: [],
        macd: [],
        bbands: [],
        klines: []
      };
      const arr = _lastData.map(item => item.close);
      indicators = await Indicator.find({ period: _period });
      for (let element of indicators) {
        if (element.name === "SMA" || element.name === "EMA") {
          for (let value of element.params) {
            var newItem = await _this.generateMAdata(element.name, arr, value);
            element.name === "SMA"
              ? loader.sma.push(newItem)
              : loader.ema.push(newItem);
          }
        }
        if (element.name === "KLines") {
          loader.klines.data = _lastData;
        }
        if (element.name === "RSI") {
          for (let value of element.params) {
            var newItem = await _this.generateRSIdata(_lastData, value);
            loader.rsi.push(newItem);
          }
        }
        if (element.name === "MACD") {
          let cont = 0; //macd uses groups of 3 params for calculation
          for (let value of element.params) {
            cont += 1;
            if (cont % 3 === 0) {
              let params = element.params.slice(cont - 3, cont);
              var newItem = await _this.generateMACDdata(_lastData, params);
              loader.macd.push(newItem);
            }
          }
        }
        if (element.name === "BBANDS") {
          for (let value of element.params) {
            var newItem = await _this.generateBBandsData(_lastData, value);
            loader.bbands.push(newItem);
          }
        }
      }
      newLoad = await ctrIndicators.saveLoad(_exchange, _pair, _period, loader);
      resolve("OK");
    } catch (err) {
      console.log("Err processIndicators: ", err);
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

function logErr(obj) {
  return new Promise(async function(resolve, reject) {
    try {
      var line =
        obj.code.toString() +
        " , " +
        obj.msg +
        " , " +
        moment().format("YYYYMMDD:HHmmss");
      console.log(line);
      await fs.appendFile(logFile, line + "\r\n");
      resolve("OK");
    } catch (err) {
      console.log("Err logMonitor: ", err);
      reject(err);
    }
  });
}

Monitor.prototype.stop = function() {
  this.stopExecute = true;
  // clearInterval(this.intervalObject);
  console.log("stopTrade");
};

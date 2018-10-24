const intervalObj = require("interval-promise");
const moment = require("moment");
const fs = require("fs-extra");

const binance = require("./binance.js");
const mavg = require("./movingAvg.js");
const klines = require("./klines.js");
const trade = require("./trade.js");

("use strict");

const logFile = "./logs/generalErrLog.txt";

module.exports = Monitor;

function Monitor(interval) {
  this.interval = interval;
  this.stopExecute = false;
}

Monitor.prototype.execute = async function() {
  var _this = this;
  intervalObj(
    async (iteration, stop) => {
      try {
        if (_this.stopExecute) {
          console.log("Stop executeTrade loop");
          stop();
        }
        const pairs = ["XRPUSDT"];
        const exchange = process.env.EXCHANGE;
        for (let pair of pairs) {
          var data = await binance.getKLines(pair, "1m");
          if (data.code) {
            console.log(data); //returned an error object
            throw data;
          }
          var result = await _this.processIndicators(exchange, data, pair);
        }
      } catch (err) {
        console.log("Err executeTrade", err);
        logErr(err);
        //_this.stopExecute = true;
      }
    },
    _this.interval,
    (options = { stopOnError: true })
  );
};

Monitor.prototype.processIndicators = function(exchange, data, pair) {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      var oIndic = {};
      var params = process.env.IND_SMA.split(",");
      oIndic.SMA = await mavg.execute(data, pair, params);
      oIndic.KLINES = result = await klines.execute(data, pair);
      //console.log("oIndic", oIndic);
      var tradeOper = await _this.defineOperation(oIndic);
      var result = await trade.execute(tradeOper, pair, oIndic);
      resolve(result);
    } catch (err) {
      console.log("Err processIndicators: ", err);
      reject(err);
    }
  });
};

Monitor.prototype.defineOperation = function(oIndic) {
  return new Promise(async function(resolve, reject) {
    try {
      var objDefineOper = { buy: 0, sell: 0 };
      Object.keys(oIndic).forEach(function(key) {
        if (oIndic[key].oper === "buy") {
          objDefineOper.buy += oIndic[key].factor;
        } else {
          objDefineOper.sell += oIndic[key].factor;
        }
      });
      resolve(objDefineOper);
    } catch (err) {
      console.log("Err defineOperation: ", err);
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
        moment().format("YYYYMMDDHHmmss");
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

const intervalObj = require("interval-promise");
const moment = require("moment");
const fs = require("fs-extra");

const binance = require("./binance.js");
const mavg = require("./movingAvg.js");
const rsi = require("./rsi.js");
const macd = require("./macd.js");
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
          if (data.length < 400) throw { code: 300, msg: "no data" };
          if (data.code) {
            console.log("Err execKLines", data.message); //returned an error object
            throw data.message;
          }
          var result = await _this.processIndicators(exchange, data, pair);
        }
      } catch (err) {
        console.log("Err executeMonitor", err.message);
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
      oIndic.SMA = await mavg.execute(data, process.env.SMA_PARAMS);
      oIndic.MACD = await macd.execute(data);
      oIndic.RSI = await rsi.execute(data, process.env.RSI_PARAMS);
      //if (oIndic.SMA.oper === "none" || oIndic.RSI.oper === "none") {
      oIndic.KLINES = result = await klines.execute(data);
      //}
      var arrIndic = [];
      Object.keys(oIndic).map(key => {
        return oIndic[key].map(element => arrIndic.push(element));
      });
      var oper = await _this.defineOperation(arrIndic);
      var result = await trade.execute(oper, pair, oIndic);
      resolve(result);
    } catch (err) {
      console.log("Err processIndicators: ", err);
      reject(err);
    }
  });
};

Monitor.prototype.defineOperation = function(arrIndic) {
  return new Promise(async function(resolve, reject) {
    try {
      oSummary = {
        buyCount: 0,
        buyFactor: 0,
        sellCount: 0,
        sellFactor: 0,
        noneCount: 0,
        noneFactor: 0
      };
      console.log("arrIndic", arrIndic);
      arrIndic.map((currValue, index, arr) => {
        switch (currValue.oper) {
          case "buy":
            oSummary.buyCount += 1;
            oSummary.buyFactor += currValue.factor;
            break;
          case "sell":
            oSummary.sellCount += 1;
            oSummary.sellFactor += currValue.factor;
            break;
          default:
            oSummary.noneCount += 1;
            oSummary.noneFactor += currValue.factor;
            break;
        }
        return oSummary;
      });
      console.log("oSummary", oSummary);
      var oper = "none";
      if (
        oSummary.buyCount >= oSummary.sellCount + 2 &&
        oSummary.buyFactor >= oSummary.sellFactor + 4
      ) {
        oper = "buy";
      }
      if (
        oSummary.sellCount >= oSummary.buyCount + 2 &&
        oSummary.sellFactor >= oSummary.buyFactor + 4
      ) {
        var oper = "sell";
      }
      resolve(oper);
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

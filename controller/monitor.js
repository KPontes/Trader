const intervalObj = require("interval-promise");
const moment = require("moment");
const fs = require("fs-extra");

const binance = require("./binance.js");
const mavg = require("./movingAvg.js");
const rsi = require("./rsi.js");
const bbands = require("./bbands.js");
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

Monitor.prototype.pooling = async function() {
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
        let data;
        for (let pair of pairs) {
          var minuteData = await binance.getKLines(pair, "1m");
          var hourData = await binance.getKLines(pair, "1h");
          minuteData.length === 500 ? (data = hourData) : (data = minuteData);
          if (data.length < 200) throw { code: 300, msg: "no data" };
          if (data.code) {
            console.log("Err execKLines", data.message); //returned an error object
            throw data.message;
          }
          var result = await _this.execute(
            exchange,
            minuteData,
            hourData,
            pair
          );
        }
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

Monitor.prototype.execute = function(exchange, minuteData, hourData, pair) {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      var objToArr = function(obj) {
        var arr = [];
        Object.keys(obj).map(key => {
          return obj[key].map(element => arr.push(element));
        });
        return arr;
      };
      const minuteIndic = await _this.processIndicators(minuteData, "1m");
      const hourIndic = await _this.processIndicators(hourData, "1h");
      const bigTrend = await rsi.trend(hourData, 72);
      const arrMin = objToArr(minuteIndic);
      const arrHour = objToArr(hourIndic);
      console.log("bigTrend", bigTrend);
      console.log("arrMin", arrMin);
      console.log("arrHour", arrHour);
      var oper = await _this.defineOperation(arrMin, arrHour, bigTrend);
      var result = await trade.execute(oper, pair, arrMin, arrHour, bigTrend);
      resolve(result);
    } catch (err) {
      console.log("Err executeMonitor: ", err);
      reject(err);
    }
  });
};

Monitor.prototype.processIndicators = function(data, period) {
  return new Promise(async function(resolve, reject) {
    try {
      var oIndic = {};
      oIndic.SMA = await mavg.execute(data, process.env.SMA_PARAMS);
      oIndic.MACD = await macd.execute(data);
      oIndic.RSI = await rsi.execute(data, process.env.RSI_PARAMS);
      oIndic.BBANDS = await bbands.execute(data, process.env.BBANDS_PARAMS);
      oIndic.KLINES = result = await klines.execute(data);

      resolve(oIndic);
    } catch (err) {
      console.log("Err processIndicators: ", err);
      reject(err);
    }
  });
};

Monitor.prototype.defineOperation = function(arrMin, arrHour, bigTrend) {
  return new Promise(async function(resolve, reject) {
    try {
      var summaryArr = function(arrIndic) {
        var oSummary = {
          buyCount: 0,
          buyFactor: 0,
          sellCount: 0,
          sellFactor: 0,
          noneCount: 0,
          noneFactor: 0
        };
        arrIndic.map(currValue => {
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
        return oSummary;
      };
      const summaryMin = summaryArr(arrMin);
      const summaryHour = summaryArr(arrHour);
      console.log("summaryMin", summaryMin);
      console.log("summaryHour", summaryHour);

      result = summaryRules(summaryMin, summaryHour, bigTrend);
      resolve(result);
    } catch (err) {
      console.log("Err defineOperation: ", err);
      reject(err);
    }
  });
};

function summaryRules(summaryMin, summaryHour, bigTrend) {
  try {
    var oper = "none";
    var bigOper = "none";
    var result = "none";
    if (
      summaryMin.buyCount >= summaryMin.sellCount + 2 &&
      summaryMin.buyFactor >= summaryMin.sellFactor + 4
    ) {
      oper = "buy";
    }
    if (
      summaryMin.sellCount >= summaryMin.buyCount + 2 &&
      summaryMin.sellFactor >= summaryMin.buyFactor + 4
    ) {
      oper = "sell";
    }
    //
    if (
      bigTrend.recentGains > bigTrend.recentLosses &&
      bigTrend.countGains > bigTrend.period * 0.6 &&
      summaryHour.buyCount > summaryHour.sellCount &&
      summaryHour.buyFactor > summaryHour.sellFactor
    ) {
      bigOper = "buy";
    }
    if (
      bigTrend.recentGains < bigTrend.recentLosses &&
      bigTrend.countGains < bigTrend.period * 0.4 &&
      summaryHour.sellCount >= summaryHour.buyCount &&
      summaryHour.sellFactor >= summaryHour.buyFactor
    ) {
      bigOper = "sell";
    }
    //
    if (bigOper === oper && oper !== "none") {
      result = oper;
    }
    return result;
  } catch (err) {
    console.log("Err summaryRules: ", err);
    return err;
  }
}

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

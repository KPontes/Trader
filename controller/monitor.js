const intervalObj = require("interval-promise");

const candles = require("./candleSticks.js");
const mavg = require("./movingAvg.js");
const trade = require("./trade.js");

("use strict");

module.exports = Monitor;

function Monitor(interval) {
  this.interval = interval;
  this.stopExecute = false;
}
Monitor.prototype.execute = async function(indicator) {
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
          var data = await candles.getKLines(pair, "1m");
          var result = await _this.processIndicators(
            exchange,
            data,
            pair,
            indicator
          );
        }
      } catch (err) {
        console.log("Err executeTrade", err);
        _this.stopExecute = true;
      }
    },
    _this.interval,
    (options = { stopOnError: true })
  );
};

Monitor.prototype.processIndicators = function(
  exchange,
  data,
  pair,
  indicator
) {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      //a idéia é processar todos os indicadores primeiro para cada PAIR
      //e depois varrer os usuários omando somente os critérios para ele cadastrados
      const users = { user: "krishnan" };
      let result;
      var oIndic = {};
      if (indicator === "SMA") {
        const params = process.env.IND_SMA.split(",");
        result = await mavg.execute(exchange, data, pair, params);
        oIndic.SMA = result;
      }
      let operationDefined;
      for (let key in users) {
        operationDefined = await _this.defineOperation(oIndic, users[key]);
        await trade.execute(operationDefined, pair, users[key]);
      }
      resolve(oIndic);
    } catch (err) {
      console.log("Err processIndicators: ", err);
      reject(err);
    }
  });
};

Monitor.prototype.defineOperation = function(oIndic, user) {
  return new Promise(async function(resolve, reject) {
    try {
      //in the future use only user selected indicators
      var oDefineOper = { buy: 0, sell: 0 };
      Object.keys(oIndic).forEach(function(key) {
        if (oIndic[key].oper === "buy") {
          oDefineOper.buy += oIndic[key].factor;
        } else {
          oDefineOper.sell += oIndic[key].factor;
        }
      });
      resolve(oDefineOper);
    } catch (err) {
      console.log("Err defineOperation: ", err);
      reject(err);
    }
  });
};

Monitor.prototype.stop = function() {
  this.stopExecute = true;
  // clearInterval(this.intervalObject);
  console.log("stopTrade");
};

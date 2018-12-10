const intervalObj = require("interval-promise");
const moment = require("moment");

const { Signalizer } = require("../models/signalizer.js");
const StrategyOne = require("../strategies/strategyOne.js");

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
        var result = await _this.execute();
      } catch (err) {
        console.log("Err planner Pooling", err.message);
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
      console.log("OK executePlanner " + moment().format("YYYYMMDD:HHmmss"));
      resolve("OK");
    } catch (err) {
      console.log("Err executePlanner: ", err);
      reject(err);
    }
  });
};

Monitor.prototype.stop = function() {
  this.stopExecute = true;
  return "OK";
};

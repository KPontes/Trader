const moment = require("moment");

const StrategyOne = require("../strategies/strategyOne.js");

("use strict");

function execute(request) {
  var _this = this;
  return new Promise(async function(resolve, reject) {
    try {
      const name = request.strategy;
      const exchange = request.exchange;
      const symbol = request.symbol;
      const period = request.period;
      const lInterval = request.largeInterval;
      const config = request.config;
      let st1Short = {};
      let st1Large = {};
      if (name === "StrategyOne") {
        st1Short = await stgOneOutputs(exchange, symbol, period, config);
        st1Large = await stgOneOutputs(exchange, symbol, lInterval, config);
      }
      resolve({
        resultShort: st1Short.result,
        summaryShort: st1Short.summary,
        resultLarge: st1Large.result,
        summaryLarge: st1Large.summary
      });
    } catch (err) {
      console.log("Err Planner monitor execute : ", err);
      reject(err);
    }
  });
}

function stgOneOutputs(exchange, symbol, period, config) {
  return new Promise(async function(resolve, reject) {
    try {
      var strategyOne = new StrategyOne(config);
      let output = await strategyOne.obtainResult(exchange, symbol, period);
      resolve(output);
    } catch (err) {
      console.log("Err Planner stgOneOutputs: ", moment().format("YYYYMMDD:HHmmss"));
      reject(err);
    }
  });
}

module.exports = {
  execute: execute
};

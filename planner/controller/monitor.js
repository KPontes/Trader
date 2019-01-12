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
      const config = request.config;
      let foundSt1 = {};
      if (name === "StrategyOne") {
        var strategyOne = new StrategyOne(config);
        foundSt1 = await strategyOne.findResult(exchange, symbol, period);
        if (foundSt1.action !== "none") {
          if (foundSt1.action === "insert") {
            foundSt1 = await strategyOne.createConfig(exchange, symbol, period);
          }
          foundSt1 = await strategyOne.updateResult(foundSt1.result);
        }
      }
      resolve({ result: foundSt1.result, summary: foundSt1.summary });
    } catch (err) {
      console.log("Err Planner monitor execute : ", err);
      reject(err);
    }
  });
}

module.exports = {
  execute: execute
};

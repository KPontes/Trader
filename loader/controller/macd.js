const _ = require("lodash");

const mavg = require("./movingAvg.js");

("use strict");

const strategy = "MACD";

const calculate = function(data, short, long, signal) {
  return new Promise(async function(resolve, reject) {
    try {
      // MACD Line: (12-day EMA - 26-day EMA)
      // Signal Line: 9-day EMA of MACD Line
      // MACD Histogram: MACD Line - Signal Line
      const objMACD = {};
      const arr = data.map(item => item.close);
      objMACD.short = await mavg.calculateEMA(arr, short);
      objMACD.long = await mavg.calculateEMA(arr, long);
      objMACD.macdLine = objMACD.short.map((a, i) =>
        _.round(a - objMACD.long[i], 12)
      );
      objMACD.signal = await mavg.calculateEMA(objMACD.macdLine, signal);

      resolve(objMACD);
    } catch (err) {
      console.log(`Err ${strategy} calculate`, err);
      reject(err);
    }
  });
};

module.exports = {
  calculate: calculate
};

const _ = require("lodash");

const mavg = require("./movingAvg.js");
const stdev = require("../utils/stdev.js");

("use strict");

const strategy = "BBands";

const calculate = function(data, period) {
  return new Promise(async function(resolve, reject) {
    try {
      // Middle Band = 20-day simple moving average (SMA)
      // Upper Band = 20-day SMA + (20-day standard deviation of price x 2)
      // Lower Band = 20-day SMA - (20-day standard deviation of price x 2)
      var oBBands = {};
      var bbands = [];
      const arr = data.map(item => item.close);
      const middle = await mavg.calculateSMA(arr, period);
      let multiplier = 2;
      if (period > 20) multiplier = 2.1;
      if (period < 20) multiplier = 1.9;
      for (var i = 0; i < data.length; i++) {
        oBBands = {
          close: 0,
          middle: 0,
          stdev: 0,
          upper: 0,
          lower: 0,
          bandWidth: 0
        };
        oBBands.close = _.round(data[i].close, 12);
        oBBands.middle = middle[i];
        if (i >= period) {
          oBBands.stdev = _.round(stdev.stdev(arr.slice(i - period, i)), 12);
          oBBands.upper = _.round(oBBands.middle + oBBands.stdev * multiplier, 12);
          oBBands.lower = _.round(oBBands.middle - oBBands.stdev * multiplier, 12);
          oBBands.bandWidth = oBBands.upper - oBBands.lower;
        }
        bbands.push(oBBands);
      }

      resolve(bbands);
    } catch (err) {
      console.log(`Err ${strategy} calculate`, err);
      reject(err);
    }
  });
};

module.exports = {
  calculate: calculate
};

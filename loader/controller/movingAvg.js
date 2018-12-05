const _ = require("lodash");

("use strict");

const strategy = "MA";

function calculateEMA(data, period) {
  return new Promise(async function(resolve, reject) {
    // Initial SMA: 10-period sum / 10
    // Multiplier: (2 / (Time periods + 1) ) = (2 / (10 + 1) ) = 0.1818 (18.18%)
    // EMA: {Close - EMA(previous day)} x multiplier + EMA(previous day).
    try {
      var arrEMA = [];
      var _sum = 0;
      var initPeriod = data.slice(0, period);
      //initial period SMA
      var initialSMA = initPeriod.reduce((a, b) => a + b, 0);
      initialSMA = _.round(initialSMA / period, 12);
      //calc multiplier
      var multiplier = _.round(2 / (period + 1), 12);
      //calc EMA as a sliding window within the period
      for (var i = 0; i < data.length; i++) {
        if (i < period) {
          arrEMA[i] = initialSMA;
        } else {
          arrEMA[i] = multiplier * (data[i] - arrEMA[i - 1]) + arrEMA[i - 1];
          arrEMA[i] = _.round(arrEMA[i], 12);
        }
      }
      resolve(arrEMA);
    } catch (err) {
      console.log("Err calculate_EMA: ", err);
      reject(err);
    }
  });
}

function calculateSMA(data, period) {
  return new Promise(async function(resolve, reject) {
    try {
      var arrSMA = [];
      var _sum = 0;
      var initPeriod = data.slice(0, period);
      //initial period absolute sum
      _sum = initPeriod.reduce((a, b) => a + b, 0);
      //sum as a sliding window within the period
      for (var i = 0; i < data.length; i++) {
        if (i < period) {
          arrSMA[i] = _sum;
        } else {
          arrSMA[i] = arrSMA[i - 1] + data[i] - data[i - period];
        }
      }
      //calc average considering the period of sum
      const result = arrSMA.map(item => _.round(item / period, 12));
      resolve(result);
    } catch (err) {
      console.log("Err calculate_SMA: ", err);
      reject(err);
    }
  });
}

module.exports = {
  calculateSMA: calculateSMA,
  calculateEMA: calculateEMA
};

const _ = require("lodash");

("use strict");

const strategy = "RSI";

const calculate = function(data, period) {
  return new Promise(async function(resolve, reject) {
    try {
      var iniGain = 0;
      var iniLoss = 0;
      var rsiData = [];
      var oRSI = { close: data[0].close };
      rsiData[0] = oRSI;
      for (var i = 1; i <= period; i++) {
        oRSI = {};
        oRSI = createRSIObj(data, i, period);
        rsiData[i] = oRSI;
        iniGain += oRSI.gain;
        iniLoss += oRSI.loss;
      }
      //first line on period limit
      oRSI = createRSIObj(data, period, period, iniGain, iniLoss);
      rsiData[period] = oRSI;
      // remaining data
      for (var i = period + 1; i < data.length; i++) {
        oRSI = {};
        oRSI = createRSIObj(data, i, period, iniGain, iniLoss, rsiData[i - 1]);
        rsiData[i] = oRSI;
      }
      resolve(rsiData);
    } catch (err) {
      console.log(`Err ${strategy} calculate`, err);
      reject(err);
    }
  });
};

function createRSIObj(
  data,
  i,
  period,
  iniGain = 0,
  iniLoss = 0,
  previousLine = {}
) {
  var oRSI = {};
  if (i === 0) return { close: data[0].close };
  oRSI.close = _.round(data[i].close, 12);
  oRSI.change = _.round(oRSI.close - data[i - 1].close, 12);
  oRSI.change >= 0
    ? ((oRSI.gain = oRSI.change), (oRSI.loss = 0))
    : ((oRSI.loss = Math.abs(oRSI.change)), (oRSI.gain = 0));
  if (i >= period) {
    if (i === period) {
      oRSI.avgGain = _.round(iniGain / period, 12);
      oRSI.avgLoss = _.round(iniLoss / period, 12);
    } else {
      oRSI.avgGain = (previousLine.avgGain * (period - 1) + oRSI.gain) / period;
      oRSI.avgGain = _.round(oRSI.avgGain, 12);
      oRSI.avgLoss = (previousLine.avgLoss * (period - 1) + oRSI.loss) / period;
      oRSI.avgLoss = _.round(oRSI.avgLoss, 12);
    }
    oRSI.rs = _.round(oRSI.avgGain / oRSI.avgLoss, 12);
    oRSI.avgLoss === 0
      ? (oRSI.rsi = 100)
      : (oRSI.rsi = 100 - 100 / (1 + oRSI.rs));
    oRSI.rsi = _.round(oRSI.rsi, 12);
  }

  return oRSI;
}

module.exports = {
  calculate: calculate
};

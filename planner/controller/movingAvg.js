const { ILoader } = require("../models/indicatorLoader.js");

("use strict");

var _this = this;

const strategy = "MA";

function getData(exchange, symbol, period, type) {
  return new Promise(async function(resolve, reject) {
    try {
      var arr = await ILoader.findOne({
        exchange,
        symbol,
        period,
        name: type
      });
      resolve(arr);
    } catch (err) {
      console.log(`Err ${strategy} getData:`, err);
      reject(err);
    }
  });
}

function applyCrossingLines(shortMA, mediumMA, longMA) {
  var objMA = { indic: "SMA", oper: "none", factor: 0, rules: "no cross line" };
  if (shortMA.slice(-1) > mediumMA.slice(-1) || shortMA.slice(-1) > longMA.slice(-1)) {
    objMA = { indic: "SMA", oper: "buy", factor: 1, rules: "one up cross" };
    if (shortMA.slice(-1) > mediumMA.slice(-1) && shortMA.slice(-1) > longMA.slice(-1)) {
      objMA.factor = 2;
      objMA.rules = "two up cross";
      if (mediumMA.slice(-1) > longMA.slice(-1)) {
        objMA.factor = 3;
        objMA.rules = "three up cross";
      }
    }
  }

  if (shortMA.slice(-1) < mediumMA.slice(-1) || shortMA.slice(-1) < longMA.slice(-1)) {
    objMA = { indic: "SMA", oper: "sell", factor: 1, rules: "one down cross" };
    if (shortMA.slice(-1) < mediumMA.slice(-1) && shortMA.slice(-1) < longMA.slice(-1)) {
      objMA.factor = 2;
      objMA.rules = "two down cross";
      if (mediumMA.slice(-1) < longMA.slice(-1)) {
        objMA.factor = 3;
        objMA.rules = "three down cross";
      }
    }
  }

  return objMA;
}

function applyCrossingLinesEMA(shortMA, mediumMA, longMA) {
  var objMA = { indic: "EMA", oper: "none", factor: 0, rules: "no cross line" };
  if (shortMA.slice(-1) > mediumMA.slice(-1) || shortMA.slice(-1) > longMA.slice(-1)) {
    objMA = { indic: "EMA", oper: "buy", factor: 1, rules: "one up cross" };
    if (shortMA.slice(-1) > mediumMA.slice(-1) && shortMA.slice(-1) > longMA.slice(-1)) {
      objMA.factor = 2;
      objMA.rules = "two up cross";
      if (mediumMA.slice(-1) > longMA.slice(-1)) {
        objMA.factor = 3;
        objMA.rules = "three up cross";
      }
    }
  }

  if (shortMA.slice(-1) < mediumMA.slice(-1) || shortMA.slice(-1) < longMA.slice(-1)) {
    objMA = { indic: "EMA", oper: "sell", factor: 1, rules: "one down cross" };
    if (shortMA.slice(-1) < mediumMA.slice(-1) && shortMA.slice(-1) < longMA.slice(-1)) {
      objMA.factor = 2;
      objMA.rules = "two down cross";
      if (mediumMA.slice(-1) < longMA.slice(-1)) {
        objMA.factor = 3;
        objMA.rules = "three down cross";
      }
    }
  }

  return objMA;
}

function applyTrend(xshortMA, lastCandles) {
  var objMA = { indic: "SMA", oper: "none", factor: 0, rules: "sideway" };
  //uptrend curve. Check 3 last avgs going up
  partial = xshortMA.slice(-lastCandles);
  let trendCount = 0;
  for (var i = 1; i < partial.length; i++) {
    trendCount = partial[i] > partial[i - 1] ? (trendCount += 1) : (trendCount -= 1);
  }
  if (trendCount === lastCandles - 1) {
    objMA.oper = "buy";
    objMA.factor = 3;
    objMA.rules = "change to up trend";
  }
  //downtrend curve. Check 3 last avgs going down
  if (-trendCount === lastCandles - 1) {
    objMA.oper = "sell";
    objMA.factor = 3;
    objMA.rules = "change to down trend";
  }

  return objMA;
}

module.exports = {
  getData: getData,
  applyCrossingLines: applyCrossingLines,
  applyTrend: applyTrend,
  applyCrossingLinesEMA: applyCrossingLinesEMA
};

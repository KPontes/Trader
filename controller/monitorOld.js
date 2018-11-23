Monitor.prototype.processIndicatorsOLD = function(data, period) {
  return new Promise(async function(resolve, reject) {
    try {
      var oIndic = {};
      oIndic.SMA = await mavg.execute(data, "7,25,99");
      oIndic.MACD = await macd.execute(data);
      oIndic.RSI = await rsi.execute(data, "14,30,70,-7");
      oIndic.BBANDS = await bbands.execute(data, "20");
      oIndic.KLINES = await klines.execute(data);
      resolve(oIndic);
    } catch (err) {
      console.log("Err processIndicators: ", err);
      reject(err);
    }
  });
};

Monitor.prototype.executeOLD = function(exchange, minuteData, hourData, pair) {
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
      const bigTrend = await rsi.trend(hourData, -72);
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
    var trend = "none";
    var result = "none";
    //big trend increases hourly summary
    if (
      bigTrend.gains > bigTrend.losses &&
      bigTrend.countGains > -(bigTrend.last * 0.6)
    ) {
      trend = "buy";
      summaryHour.buyCount += 1;
      summaryHour.buyFactor += 1;
    }

    if (
      bigTrend.gains < bigTrend.losses &&
      bigTrend.countGains < -(bigTrend.last * 0.4)
    ) {
      trend = "sell";
      summaryHour.sellCount += 1;
      summaryHour.sellFactor += 1;
    }
    //
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
      summaryHour.buyCount > summaryHour.sellCount &&
      summaryHour.buyFactor > summaryHour.sellFactor
    ) {
      bigOper = "buy";
    }
    if (
      summaryHour.buyCount < summaryHour.sellCount &&
      summaryHour.buyFactor < summaryHour.sellFactor
    ) {
      bigOper = "sell";
    }

    console.log(
      "Oper: " + oper + " / bigOper: " + bigOper + " / trend: " + trend
    );

    if (bigOper === oper && oper !== "none") {
      result = oper;
    }
    return result;
  } catch (err) {
    console.log("Err summaryRules: ", err);
    return err;
  }
}

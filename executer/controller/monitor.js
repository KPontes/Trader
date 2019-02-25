const intervalObj = require("interval-promise");
const moment = require("moment");

const { User } = require("../models/user.js");
const { LoaderSettings } = require("../models/loaderSettings.js");
const trade = require("./trade.js");

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
        console.log("Err executer Pooling", err.message);
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
      let exchangeList = await LoaderSettings.find();
      let priceList = await trade.getSymbolPricesAPI();
      for (let exchange of exchangeList) {
        let userList = await User.find({
          exchange: exchange.exchange,
          status: User.UserStatus.activeOn,
          validtil: { $gt: Date() }
        });
        for (let symbol of exchange.symbols) {
          for (let user of userList) {
            let ind = user.monitor.findIndex(doc => doc.symbol === symbol);
            if (ind !== -1) {
              let config = {
                calc: user.monitor[ind].configcalc,
                rule: user.monitor[ind].configrule
              };
              let stResults = await trade.getStrategyResultsAPI(
                user.monitor[ind].strategy,
                user.exchange,
                user.monitor[ind].symbol,
                user.monitor[ind].period,
                user.monitor[ind].largeInterval,
                config
              );
              if (!stResults.summaryShort) {
                throw "Invalid GetStrategyResults";
              }
              await trade.execute(user, ind, priceList, stResults);
            }
          }
        }
      }
      console.log("OK Executer execute " + moment().format("YYYYMMDD:HHmmss"));
      resolve("OK");
    } catch (err) {
      console.log("Err Executer execute " + moment().format("YYYYMMDD:HHmmss"));
      if (err.response) {
        console.log(`${err.response.status}: ${err.response.statusText} - ${err.response.data}`);
      }
      reject(err);
    }
  });
};

// Monitor.prototype.execute = function() {
//   var _this = this;
//   return new Promise(async function(resolve, reject) {
//     try {
//       let userList = await User.find({
//         status: User.UserStatus.activeOn,
//         validtil: { $gt: Date() }
//       });
//       let priceList = await trade.getSymbolPricesAPI();
//       for (let user of userList) {
//         let index = 0; //monitor array index
//         for (let monitor of user.monitor) {
//           let config = { calc: monitor.configcalc, rule: monitor.configrule };
//           let stResults = await trade.getStrategyResultsAPI(
//             monitor.strategy,
//             user.exchange,
//             monitor.symbol,
//             monitor.period,
//             monitor.largeInterval,
//             config
//           );
//           await trade.execute(user, index, priceList, stResults);
//           index += 1;
//         }
//       }
//       console.log("OK Executer execute, " + moment().format("YYYYMMDD:HHmmss"));
//       resolve("OK");
//     } catch (err) {
//       console.log("Err Executer execute");
//       if (err.response) {
//         console.log(`${err.response.status}: ${err.response.statusText} - ${err.response.data}`);
//       }
//       reject(err);
//     }
//   });
// };

Monitor.prototype.stop = function() {
  this.stopExecute = true;
  return "OK";
};

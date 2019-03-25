//const intervalObj = require("interval-promise");
const moment = require("moment");

const { User } = require("../models/user.js");
const trade = require("./trade.js");
const sysconst = require("../utils/sysconst.js");
//const { LoaderSettings } = require("../models/loaderSettings.js");

("use strict");

function execute(reqobj) {
  return new Promise(async function(resolve, reject) {
    try {
      let exchange = reqobj.exchange;
      let symbol = reqobj.symbol;
      let userList = await User.find({
        exchange,
        status: User.UserStatus.activeOn,
        validtil: { $gt: Date() }
      });
      for (let user of userList) {
        let ind = user.monitor.findIndex(doc => doc.symbol === symbol);
        if (ind !== -1) {
          //No await so error for one user will stop propagation on execOneUserSymbol
          //and do not affect this execution loop for other users
          execOneUserSymbol(reqobj, user, ind);
        }
      }
      resolve(`OK Executer ${symbol} ${moment().format("YYYYMMDD:HHmmss")}`);
    } catch (err) {
      console.log("Err Executer execute " + moment().format("YYYYMMDD:HHmmss"));
      if (err.response) {
        console.log(`${err.response.status}: ${err.response.statusText} - ${err.response.data}`);
      }
      reject(err);
    }
  });
}

function execOneUserSymbol(reqobj, user, ind) {
  return new Promise(async function(resolve, reject) {
    try {
      let exchange = reqobj.exchange;
      let priceList = reqobj.priceList;
      let symbol = reqobj.symbol;

      let defConfig = sysconst.DEFAULTCONFIG;
      let configcalc = {};
      let configrule = {};
      Object.entries(defConfig).map(element => {
        if (element[0].substring(0, 5) === "calc_") {
          configcalc[element[0].substring(5)] = element[1];
        }
        if (element[0].substring(0, 5) === "rule_") {
          configrule[element[0].substring(5)] = element[1];
        }
      });
      let userConfig = {
        calc: user.monitor[ind].configcalc,
        rule: user.monitor[ind].configrule
      };
      //merge default items with the ones on userConfig. This is to prevent errors
      //when adding new algorithms to the application
      Object.keys(configcalc).map(key => {
        if (!userConfig.calc[key]) {
          userConfig.calc[key] = configcalc[key];
        }
      });
      Object.keys(configrule).map(key => {
        if (!userConfig.rule[key]) {
          userConfig.rule[key] = configrule[key];
        }
      });

      let stResults = await trade.getStrategyResultsAPI(
        user.monitor[ind].strategy,
        user.exchange,
        user.monitor[ind].symbol,
        user.monitor[ind].period,
        user.monitor[ind].largeInterval,
        userConfig
      );
      if (!stResults.summaryShort) {
        throw "Invalid GetStrategyResults";
      }
      await trade.execute(user, ind, priceList, stResults);
      console.log(
        `OK ExecOneUser ${user.username} ${symbol} ${moment().format("YYYYMMDD:HHmmss")}`
      );
      resolve("OK");
    } catch (err) {
      console.log("Err ExecOneUser " + moment().format("YYYYMMDD:HHmmss"));
      if (err.response) {
        console.log(`${err.response.status}: ${err.response.statusText} - ${err.response.data}`);
      }
      reject(err);
    }
  });
}

module.exports = {
  execute: execute
};

// function Monitor(interval) {
//   if interval
//   this.interval = interval;
//   this.stopExecute = false;
// }
//
// Monitor.prototype.pooling = async function() {
//   var _this = this;
//   intervalObj(
//     async (iteration, stop) => {
//       try {
//         if (_this.stopExecute) {
//           console.log("Stop executeTrade loop");
//           stop();
//         }
//         var result = await _this.execute();
//       } catch (err) {
//         console.log("Err executer Pooling", err.message);
//         //_this.stopExecute = true;
//       }
//     },
//     _this.interval,
//     (options = { stopOnError: true })
//   );
// };
//
// Monitor.prototype.executePool = function() {
//   var _this = this;
//   return new Promise(async function(resolve, reject) {
//     try {
//       let exchangeList = await LoaderSettings.find();
//       let priceList = await trade.getSymbolPricesAPI();
//       for (let exchange of exchangeList) {
//         let userList = await User.find({
//           exchange: exchange.exchange,
//           status: User.UserStatus.activeOn,
//           validtil: { $gt: Date() }
//         });
//         for (let symbol of exchange.symbols) {
//           for (let user of userList) {
//             let ind = user.monitor.findIndex(doc => doc.symbol === symbol);
//             if (ind !== -1) {
//               let config = {
//                 calc: user.monitor[ind].configcalc,
//                 rule: user.monitor[ind].configrule
//               };
//               let stResults = await trade.getStrategyResultsAPI(
//                 user.monitor[ind].strategy,
//                 user.exchange,
//                 user.monitor[ind].symbol,
//                 user.monitor[ind].period,
//                 user.monitor[ind].largeInterval,
//                 config
//               );
//               if (!stResults.summaryShort) {
//                 throw "Invalid GetStrategyResults";
//               }
//               await trade.execute(user, ind, priceList, stResults);
//             }
//           }
//         }
//       }
//       console.log("OK Executer execute " + moment().format("YYYYMMDD:HHmmss"));
//       resolve("OK");
//     } catch (err) {
//       console.log("Err Executer execute " + moment().format("YYYYMMDD:HHmmss"));
//       if (err.response) {
//         console.log(`${err.response.status}: ${err.response.statusText} - ${err.response.data}`);
//       }
//       reject(err);
//     }
//   });
// };
//
// Monitor.prototype.stop = function() {
//   this.stopExecute = true;
//   return "OK";
// };

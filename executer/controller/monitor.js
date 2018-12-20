const intervalObj = require("interval-promise");
const moment = require("moment");

const { User } = require("../models/user.js");
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
      let userList = await User.find({ status: User.UserStatus.activeOn });
      let priceList = await trade.getSymbolPricesAPI();
      let stResults = await trade.getStrategyResultsAPI();
      for (let user of userList) {
        await trade.execute(user, priceList, stResults);
      }
      console.log("OK executeExecuter, " + moment().format("YYYYMMDD:HHmmss"));
      resolve("OK");
    } catch (err) {
      //console.log("Err executeExecuter: ", err);
      reject(err);
    }
  });
};

function getTransactions(trades) {
  return new Promise(async function(resolve, reject) {
    try {
      var transactions = [];
      for (let trade of trades) {
        var tr = await Transaction.findOne({
          tradeKey: ObjectId(trade._id)
        }).exec();
        transactions.push(tr);
      }
      resolve(transactions);
    } catch (e) {
      console.log("getTransaction Error: ", e);
      reject(e);
    }
  });
}

Monitor.prototype.stop = function() {
  this.stopExecute = true;
  return "OK";
};

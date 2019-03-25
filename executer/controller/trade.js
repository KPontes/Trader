const moment = require("moment");
const _ = require("lodash");
const axios = require("axios");
const axiosRetry = require("axios-retry");

const stgOne = require("./strategyOne.js");
const { Trade } = require("../models/trade.js");
const { User } = require("../models/user.js");

("use strict");

var _this = this;

function matchPrice(symbol, pricelist) {
  let result = pricelist.find(element => element.symbol === symbol);
  return result ? Number(result.price) : undefined;
}

exports.execute = function(user, index, priceList, stgResults) {
  return new Promise(async function(resolve, reject) {
    try {
      console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++");
      let userpair = user.monitor[index];
      let [userResultShort, summaryShort] = summarize(userpair.algos, stgResults.resultShort);
      let [userResultLarge, summaryLarge] = summarize(userpair.algos, stgResults.resultLarge);
      let price = matchPrice(userpair.symbol, priceList);
      let btcusdt = matchPrice("BTCUSDT", priceList);
      let tradeLog = {
        user: user.username,
        symbol: userpair.symbol,
        resultShort: userResultShort,
        summaryShort,
        resultLarge: userResultLarge,
        summaryLarge,
        price: price,
        top: userpair.stopLoss.topPrice,
        bottom: userpair.stopLoss.bottomPrice
      };
      //define largeInterval operation technical analysis
      let largeOperation = await stgOne.defineOperationLarge(user, userpair, summaryLarge);
      //define shortInterval operation technical analysis
      let shortOperation = await stgOne.defineOperationShort(
        user,
        userpair,
        summaryShort,
        price,
        largeOperation.oper,
        tradeLog
      );
      let order = await stgOne.makeOrder(
        shortOperation,
        largeOperation,
        user,
        index,
        price,
        btcusdt
      );
      resolve("OK Trade Execute");
    } catch (err) {
      console.log("Err trade execute ");
      if (err.response) {
        console.log(`${err.response.status}: ${err.response.statusText} - ${err.response.data}`);
      }
      reject(err);
    }
  });
};

exports.getSymbolPricesAPI = function() {
  return new Promise(function(resolve, reject) {
    axiosRetry(axios, { retries: 3 });
    axios
      .get(process.env.LOADER_URL + "/getsymbolprices")
      .then(res => {
        resolve(res.data);
      })
      .catch(err => {
        reject(err);
      });
  });
};

exports.getStrategyResultsAPI = function(
  strategy,
  exchange,
  symbol,
  period,
  largeInterval,
  config
) {
  return new Promise(function(resolve, reject) {
    let data = {
      strategy,
      exchange,
      symbol,
      period,
      largeInterval,
      config
    };
    axiosRetry(axios, { retries: 3 });
    axios({
      method: "post",
      url: process.env.PLANNER_URL + "/getstrategyresults",
      data: data
    })
      .then(function(res) {
        //console.log(res);
        resolve(res.data);
      })
      .catch(function(err) {
        console.log("Err getStrategyResultsAPI");
        console.log(`${err.response.status}: ${err.response.statusText} - ${err.response.data}`);
        reject(err);
      });
  });
};

exports.list = function(reqobj) {
  return new Promise(async function(resolve, reject) {
    try {
      let email = reqobj.email;
      let mode = reqobj.mode;
      let user = await User.findOne({ email });
      let symbol = reqobj.symbol;
      let startDate = reqobj.startDate;
      let tradeList = await Trade.find({
        userId: user._id,
        symbol,
        orderMode: mode,
        createdAt: { $gte: startDate }
      })
        .sort({ createdAt: 1 })
        .exec();
      resolve(tradeList);
    } catch (err) {
      console.log("Err trade list ", err);
      reject(err);
    }
  });
};

exports.perform = function(reqobj) {
  return new Promise(async function(resolve, reject) {
    try {
      let user = await User.findOne({ role: "tracker" });
      let symbol = reqobj.symbol;
      let tradeList = await Trade.find({
        userId: user._id,
        symbol
      })
        .sort({ createdAt: 1 })
        .exec();
      resolve(tradeList);
    } catch (err) {
      console.log("Err perform list ", err);
      reject(err);
    }
  });
};

function summarize(algos, lastResult) {
  try {
    let userResult = lastResult.filter(element => {
      if (algos.indexOf(element.indic.toUpperCase()) !== -1) {
        return element;
      }
    });
    let summary = {
      countBuy: 0,
      countSell: 0,
      countNone: 0,
      factorBuy: 0,
      factorSell: 0,
      factorNone: 0
    };
    userResult.map(element => {
      switch (element.oper) {
        case "buy":
          summary.countBuy += 1;
          summary.factorBuy += element.factor;
          break;
        case "sell":
          summary.countSell += 1;
          summary.factorSell += element.factor;
          break;
        default:
          summary.countNone += 1;
          summary.factorNone += element.factor;
          break;
      }
    });
    return [userResult, summary];
  } catch (err) {
    console.log(`Err Trade summarize:`, err);
    return err;
  }
}

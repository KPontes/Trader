const moment = require("moment");
const _ = require("lodash");
const axios = require("axios");

const stgOne = require("../strategies/strategyOne.js");

("use strict");

var _this = this;

function matchPrice(exchange, symbol, pricelist) {
  let result = pricelist.find(function(element) {
    if (element.exchange === exchange && element.symbol === symbol) {
      return element;
    }
  });
  return result ? Number(result.value) : undefined;
}

exports.execute = function(user, index, priceList, stgResults) {
  return new Promise(async function(resolve, reject) {
    try {
      let userpair = user.monitor[index];
      let price = matchPrice(user.exchange, userpair.symbol, priceList);
      console.log("**********************************************");
      console.log("Result", stgResults.result);
      console.log("Summary", stgResults.summary);
      console.log("Price " + userpair.symbol, price);
      console.log("Top ", userpair.stopLoss.topPrice);
      console.log("Bottom ", userpair.stopLoss.bottomPrice);
      let operation = await stgOne.defineOperation(user, userpair, stgResults.summary, price);
      let order = await stgOne.makeOrder(operation, user, index, price);
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

exports.getStrategyResultsAPI = function(strategy, exchange, symbol, period, config) {
  return new Promise(function(resolve, reject) {
    let data = {
      strategy,
      exchange,
      symbol,
      period,
      config
    };
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

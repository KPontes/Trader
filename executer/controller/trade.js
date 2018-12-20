const moment = require("moment");
const _ = require("lodash");
const fs = require("fs-extra");
const axios = require("axios");

const binance = require("./binance.js");
const stgOne = require("../strategies/strategyOne.js");

("use strict");

var _this = this;
const tradeFile = "./logs/aggregateTrades.txt";

function matchPrice(exchange, symbol, pricelist) {
  let result = pricelist.find(function(element) {
    if (element.exchange === exchange && element.symbol === symbol) {
      return element;
    }
  });
  return result ? Number(result.value) : undefined;
}

function matchResult(exchange, userPair, stResults) {
  let symbol = userPair.symbol;
  let period = userPair.period;
  let strategy = userPair.strategy;
  let result = stResults.find(function(element) {
    if (
      element.exchange === exchange &&
      element.symbol === symbol &&
      element.name === strategy &&
      element.period === period
    ) {
      return element;
    }
  });
  return result ? result.lastsummary : undefined;
}

exports.execute = function(user, priceList, strategyResults) {
  return new Promise(async function(resolve, reject) {
    try {
      var index = 0;
      for (let userpair of user.monitor) {
        let price = matchPrice(user.exchange, userpair.symbol, priceList);
        let summary = matchResult(user.exchange, userpair, strategyResults);
        let operation = await stgOne.defineOperation(
          user,
          userpair,
          summary,
          price
        );
        let order = await stgOne.makeOrder(operation, user, index, price);
        index += 1;
      }
      throw "TESTE";
      if (
        oper.toLowerCase() !== users[0].pairs[0].lastOrder.toLowerCase() &&
        oper !== "none"
      ) {
        var symbolData = await binance.symbolPrice(pair);
        var variation =
          (symbolData.price - users[0].pairs[0].lastPrice) /
          users[0].pairs[0].lastPrice;
        if (Math.abs(variation) > users[0].pairs[0].minVariation) {
          console.log("tradeOper", oper + " , " + symbolData.price);
          result = await binance.putOrder(
            oper,
            pair,
            "MARKET",
            users[0].pairs[0].quantity
          );
          //update user. por enquanto só funciona para 1 user
          users[0].pairs[0].lastPrice = symbolData.price;
          users[0].pairs[0].lastOrder = oper;
          result = await modelUsers.setUsers(users);
          await log(oper, symbolData.price, arrMin, arrHour, bigTrend);
        }
      }
      resolve(result);
    } catch (err) {
      console.log("Err trade execute : ");
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

exports.getStrategyResultsAPI = function() {
  return new Promise(function(resolve, reject) {
    axios
      .get(process.env.PLANNER_URL + "/getstrategyresults")
      .then(res => {
        resolve(res.data);
      })
      .catch(err => {
        reject(err);
      });
  });
};

matchPrice;

exports.OLDexecute = function(oper, pair, arrMin, arrHour, bigTrend) {
  return new Promise(async function(resolve, reject) {
    try {
      console.log("tradeExecute", oper);
      let result = "no trade";
      users = await modelUsers.getUsers();
      //FALTA BUSCAR O BALANCE DISPONIVEL DA ACCOUNT E TRATAR EM QUANTITY
      //do not execute same operation direction repeatedly
      if (
        oper.toLowerCase() !== users[0].pairs[0].lastOrder.toLowerCase() &&
        oper !== "none"
      ) {
        var symbolData = await binance.symbolPrice(pair);
        var variation =
          (symbolData.price - users[0].pairs[0].lastPrice) /
          users[0].pairs[0].lastPrice;
        if (Math.abs(variation) > users[0].pairs[0].minVariation) {
          console.log("tradeOper", oper + " , " + symbolData.price);
          result = await binance.putOrder(
            oper,
            pair,
            "MARKET",
            users[0].pairs[0].quantity
          );
          //update user. por enquanto só funciona para 1 user
          users[0].pairs[0].lastPrice = symbolData.price;
          users[0].pairs[0].lastOrder = oper;
          result = await modelUsers.setUsers(users);
          await log(oper, symbolData.price, arrMin, arrHour, bigTrend);
        }
      }
      resolve(result);
    } catch (err) {
      console.log("Err trade execute : ", err);
      reject(err);
    }
  });
};

exports.oneTrade = function() {
  return new Promise(async function(resolve, reject) {
    try {
      //var serverTime = await binance.serverTime();
      result = await binance.putOrder();
      resolve(result);
    } catch (err) {
      console.log("Err oneTrade: ", err);
      reject(err);
    }
  });
};

function log(oper, price, arrMin, arrHour, bigTrend) {
  return new Promise(async function(resolve, reject) {
    try {
      var line =
        oper +
        " ; " +
        moment().format("YYYYMMDD:HHmmss") +
        " ; " +
        price.toString() +
        " ; " +
        JSON.stringify(arrMin) +
        " ; " +
        JSON.stringify(arrHour) +
        " ; " +
        JSON.stringify(bigTrend);
      console.log("LINE", line);
      await fs.appendFile(tradeFile, line + "\r\n");
      resolve("OK");
    } catch (err) {
      console.log("Err log: ", err);
      reject(err);
    }
  });
}

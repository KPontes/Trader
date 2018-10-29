const moment = require("moment");
const _ = require("lodash");
const fs = require("fs-extra");

const binance = require("./binance.js");
const modelUsers = require("../models/juser");
("use strict");

var _this = this;
const tradeFile = "./logs/aggregateTrades.txt";

exports.execute = function(oper, pair, oIndicadores) {
  return new Promise(async function(resolve, reject) {
    try {
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
          await log(oper, symbolData.price, JSON.stringify(oIndicadores));
        }
      }
      resolve(result);
    } catch (err) {
      console.log("Err trade execute execute: ", err);
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

function log(oper, price, indicadores) {
  return new Promise(async function(resolve, reject) {
    try {
      var line =
        oper +
        " ; " +
        moment().format("YYYYMMDD:HHmmss") +
        " ; " +
        price.toString() +
        " ; " +
        indicadores;
      console.log(line);
      await fs.appendFile(tradeFile, line + "\r\n");
      resolve("OK");
    } catch (err) {
      console.log("Err log: ", err);
      reject(err);
    }
  });
}

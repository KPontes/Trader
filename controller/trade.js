const moment = require("moment");
const _ = require("lodash");
const fs = require("fs-extra");

const binance = require("./binance.js");
const modelUsers = require("../models/juser");
("use strict");

var _this = this;
const tradeFile = "./logs/aggregateTrades.txt";

exports.execute = function(tradeOper, pair, oIndicadores) {
  return new Promise(async function(resolve, reject) {
    try {
      let oper;
      let result = "";
      users = await modelUsers.getUsers();
      //FALTA BUSCAR O BALANCE DISPONIVEL DA ACCOUNT E TRATAR EM QUANTITY
      tradeOper.buy > tradeOper.sell ? (oper = "BUY") : (oper = "SELL");
      if (tradeOper.buy !== tradeOper.sell) {
        //do not execute same operation direction repeatedly
        if (oper.toUpperCase() !== users[0].lastOrder.toUpperCase()) {
          console.log("tradeOper", tradeOper);
          result = await binance.putOrder(
            oper,
            pair,
            "MARKET",
            users[0].quantity
          );
          //por enquanto só funciona para 1 user
          users[0].lastOrder = oper;
          result = await modelUsers.setUsers(users);
          var data = await binance.symbolPrice(pair);
          await log(oper, data.price, JSON.stringify(oIndicadores));
        }
        resolve(result);
      } else {
        resolve("no trade");
      }
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
        moment().format("YYYYMMDDHHmmss") +
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

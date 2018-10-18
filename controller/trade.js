const moment = require("moment");
const _ = require("lodash");
const fs = require("fs-extra");

("use strict");

var _this = this;
const logFile = "./logs/logMA.txt";
const tradeFile = "./logs/tradeMA.txt";

exports.execute = function(operationDefined, pair, user) {
  return new Promise(async function(resolve, reject) {
    try {
      console.log(operationDefined);
      console.log(pair);
      console.log(user);
      resolve(result);
    } catch (err) {
      console.log("Err movingAvg execute: ", err);
      reject(err);
    }
  });
};

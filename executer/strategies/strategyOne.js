const ctruser = require("../controller/user.js");
const ctrexchange = require("../controller/exchange.js");
const scrypto = require("../utils/simplecrypto.js");
const { User } = require("../models/user.js");

("use strict");

function makeOrder(operation, user, index, currPrice) {
  return new Promise(async function(resolve, reject) {
    try {
      const userpair = user.monitor[index];
      const exchange = user.exchange;
      const symbol = userpair.symbol;
      let upduser = await updateStopLoss(user, index, currPrice);
      let result = {};
      if (operation.oper !== "none") {
        const tk = scrypto.decrypt(user.tk, process.env.SYSPD);
        const sk = scrypto.decrypt(user.sk, process.env.SYSPD);
        let amount = await ctruser.getBalance(exchange, symbol, tk, sk);
        if (amount > userpair.maxAmount) amount = userpair.maxAmount;
        result = await ctrexchange.putOrder(
          exchange,
          operation.oper,
          symbol,
          "MARKET",
          amount,
          tk,
          sk
        );
        let doc = await updatePosOrder(operation.oper, user, index, currPrice);
        //SALVAR TRADES EXECUTADAS NO BD
      }
      resolve(result);
    } catch (err) {
      console.log("Err makeOrder ", err);
      reject(err);
    }
  });
}

function updateStopLoss(user, index, currPrice) {
  return new Promise(async function(resolve, reject) {
    try {
      const userpair = user.monitor[index];
      let upduser = await User.findById(user._id);
      //update stoploss topPrice.
      //instead of check Buy, better check if user has balance
      if (
        currPrice > userpair.stopLoss.topPrice &&
        user.lastDirection === "buy"
      ) {
        if (upduser) {
          upduser.monitor[index].stopLoss = {
            variation: userpair.stopLoss.variation,
            topPrice: currPrice
          };
          await upduser.save();
        }
      }
      resolve(upduser);
    } catch (err) {
      console.log("Err updateStopLoss ", err);
      reject(err);
    }
  });
}

function updatePosOrder(oper, user, index, currPrice) {
  return new Promise(async function(resolve, reject) {
    try {
      //INCLUIR UPDATE DE TRADES PARA USER TER LOG DAS trades

      //update user.userpair.lastPrice, lastDirection and stoploss
      const userpair = user.monitor[index];
      let upduser = await User.findById(user._id);
      if (upduser) {
        upduser.monitor[index].lastDirection = oper;
        upduser.monitor[index].lastPrice = currPrice;
        if (oper === "sell") {
          upduser.monitor[index].stopLoss = {
            variation: userpair.stopLoss.variation,
            topPrice: 0.001
          };
        }
        await upduser.save();
      }
      resolve(upduser);
    } catch (err) {
      console.log("Err updateUserPair ", err);
      reject(err);
    }
  });
}

function defineOperation(user, userpair, summary, currPrice) {
  return new Promise(async function(resolve, reject) {
    try {
      let oResult = {};
      oResult = summaryRules(userpair, summary);
      oResult = variationRules(oResult, userpair, currPrice);
      oResult = directionRules(oResult, userpair);
      resolve(oResult);
    } catch (err) {
      console.log("Err stOne defineOperation: ", err);
      reject(err);
    }
  });
}

function directionRules(oResult, userpair) {
  try {
    //treat direction
    if (oResult.oper === userpair.lastDirection.toLowerCase()) {
      oResult.oper = "none";
      oResult.rule = "same direction as previous operation";
    }
    return oResult;
  } catch (err) {
    console.log("Err stOne directionRules: ", err);
  }
}

function variationRules(oResult, userpair, currPrice) {
  try {
    //treat variation to last operation price
    let variation = (currPrice - userpair.lastPrice) / userpair.lastPrice;
    if (Math.abs(variation) < userpair.minVariation) {
      oResult.oper = "none";
      oResult.rule = "price variation smaller than minimum configured";
    }
    //treat stop loss variation to last top price
    variation =
      (currPrice - userpair.stopLoss.topPrice) / userpair.stopLoss.topPrice;
    if (
      currPrice < userpair.stopLoss.topPrice &&
      Math.abs(variation) > userpair.stopLoss.variation
    ) {
      oResult.oper = "sell";
      oResult.rule = "stop loss";
    }
    return oResult;
  } catch (err) {
    console.log("Err stOne variationRules: ", err);
  }
}

function summaryRules(userpair, summary) {
  try {
    let oper = "none";
    let rule = "none";
    //treat summary rules
    if (
      userpair.summaryRule.count === "unanimous" &&
      userpair.summaryRule.factor === "3"
    ) {
      if (
        summary.countBuy > summary.countSell + summary.countNone &&
        summary.factorBuy > summary.factorSell + 3
      ) {
        oper = "buy";
        rule = "count & factor summary";
      }
      if (
        summary.countSell > summary.countBuy + summary.countNone &&
        summary.factorSell > summary.factorBuy + 3
      ) {
        oper = "sell";
        rule = "count & factor summary";
      }
    }
    return { oper, rule };
  } catch (err) {
    console.log("Err stOne symmaryRules: ", err);
  }
}

module.exports = {
  defineOperation: defineOperation,
  makeOrder: makeOrder
};

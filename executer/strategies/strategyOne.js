const ctruser = require("../controller/user.js");
const ctrexchange = require("../controller/exchange.js");
const scrypto = require("../utils/simplecrypto.js");
const { User } = require("../models/user.js");
const { Trade } = require("../models/trade.js");

("use strict");

function makeOrder(operation, user, index, currPrice) {
  return new Promise(async function(resolve, reject) {
    try {
      const userpair = user.monitor[index];
      const exchange = user.exchange;
      const symbol = userpair.symbol;
      const ordertype = "MARKET";
      const oper = operation.oper;
      const log = operation.log;
      let upduser = await updateStopLoss(user, index, currPrice);
      let order = {};
      if (oper !== "none") {
        const tk = scrypto.decrypt(user.tk, process.env.SYSPD);
        const sk = scrypto.decrypt(user.sk, process.env.SYSPD);
        let amount = await ctruser.getBalance(exchange, symbol, tk, sk);
        if (amount > userpair.maxAmount) amount = userpair.maxAmount;
        order = await ctrexchange.putOrder(exchange, oper, symbol, ordertype, amount, tk, sk);
        let doc = await updUserPostOrder(oper, user, index, currPrice);
        console.log("Trade", oper);
        let trade = await Trade.insert(
          user._id,
          exchange,
          symbol,
          ordertype,
          oper,
          currPrice,
          amount,
          log
        );
      }
      resolve(order);
    } catch (err) {
      console.log("Err makeOrder ", err);
      reject(err);
    }
  });
}

function updateStopLoss(user, index, currPrice) {
  return new Promise(async function(resolve, reject) {
    try {
      //update stoploss topPrice
      const userpair = user.monitor[index];
      let upduser = await User.findById(user._id);
      if (
        currPrice > userpair.stopLoss.topPrice &&
        userpair.lastDirection.toLowerCase() === "buy"
      ) {
        if (upduser) {
          upduser.monitor[index].stopLoss = {
            topVariation: userpair.stopLoss.topVariation,
            bottomVariation: userpair.stopLoss.bottomVariation,
            topPrice: currPrice,
            bottomPrice: Number.MAX_SAFE_INTEGER
          };
          await upduser.save();
        }
      }
      if (
        currPrice < userpair.stopLoss.bottomPrice &&
        userpair.lastDirection.toLowerCase() === "sell"
      ) {
        if (upduser) {
          upduser.monitor[index].stopLoss = {
            topVariation: userpair.stopLoss.topVariation,
            bottomVariation: userpair.stopLoss.bottomVariation,
            topPrice: 0.001,
            bottomPrice: currPrice
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

function updUserPostOrder(oper, user, index, currPrice) {
  return new Promise(async function(resolve, reject) {
    try {
      //update user.userpair.lastPrice, lastDirection and stoploss
      const userpair = user.monitor[index];
      let upduser = await User.findById(user._id);
      if (upduser) {
        upduser.monitor[index].lastDirection = oper;
        upduser.monitor[index].lastPrice = currPrice;
        if (oper.toLowerCase() === "buy") {
          upduser.monitor[index].stopLoss = {
            topVariation: userpair.stopLoss.topVariation,
            bottomVariation: userpair.stopLoss.bottomVariation,
            topPrice: currPrice,
            bottomPrice: Number.MAX_SAFE_INTEGER
          };
        } else {
          upduser.monitor[index].stopLoss = {
            topVariation: userpair.stopLoss.topVariation,
            bottomVariation: userpair.stopLoss.bottomVariation,
            topPrice: 0.001,
            bottomPrice: currPrice
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

function defineOperation(user, userpair, summary, currPrice, tradeLog) {
  return new Promise(async function(resolve, reject) {
    try {
      let srules = summaryRules(userpair, summary);
      tradeLog.summaryRules = Object.assign({}, srules);
      let vrules = variationRules(srules, userpair, currPrice);
      tradeLog.variationRules = Object.assign({}, vrules);
      let drules = directionRules(vrules, userpair);
      tradeLog.directionRules = Object.assign({}, drules);
      console.log("defineOperation", tradeLog);
      resolve({ oper: drules.oper, rule: drules.rule, log: tradeLog });
    } catch (err) {
      console.log("Err stOne defineOperation: ", err);
      reject(err);
    }
  });
}

function summaryRules(userpair, summary) {
  try {
    let oper = "none";
    let rule = "none";
    //treat summary rules
    if (userpair.summaryRule.count === "unanimous" && userpair.summaryRule.factor === "3") {
      if (
        summary.countBuy >= summary.countSell + summary.countNone &&
        summary.factorBuy > summary.factorSell + 3
      ) {
        oper = "buy";
        rule = "count & factor summary";
      }
      if (
        summary.countSell >= summary.countBuy + summary.countNone &&
        summary.factorSell > summary.factorBuy + 3
      ) {
        oper = "sell";
        rule = "count & factor summary";
      }
    }
    return { oper, rule };
  } catch (err) {
    console.log("Err stOne summaryRules: ", err);
  }
}

function variationRules(previousResult, userpair, currPrice) {
  try {
    let oResult = Object.assign({}, previousResult); //so I dont modify the input parameter obj
    let inputOper = oResult.oper;
    //treat stop loss variation to last top price
    let topVariation = (currPrice - userpair.stopLoss.topPrice) / userpair.stopLoss.topPrice;
    if (inputOper === "sell" && currPrice < userpair.stopLoss.topPrice) {
      if (
        Math.abs(topVariation) > userpair.stopLoss.topVariation ||
        currPrice < userpair.lastPrice
      ) {
        oResult.oper = inputOper;
        oResult.rule = "stop loss";
      } else {
        oResult.oper = "none";
        oResult.rule = "price variation smaller than stop loss";
      }
    }
    //treat start gain variation to last bottom price. Delayed version to buy
    let bottomVariation =
      (currPrice - userpair.stopLoss.bottomPrice) / userpair.stopLoss.bottomPrice;
    if (inputOper === "buy" && currPrice > userpair.stopLoss.bottomPrice) {
      if (Math.abs(bottomVariation) > userpair.stopLoss.bottomVariation) {
        //excluded condition (or currPrice > userpair.lastPrice).
        //Now use stoploss small, startgain large
        oResult.oper = inputOper;
        oResult.rule = "start gain";
      } else {
        oResult.oper = "none";
        oResult.rule = "price variation smaller than start gain";
      }
    }
    // //treat variation to last operation price. Overlaps previous rules
    // let variation = (currPrice - userpair.lastPrice) / userpair.lastPrice;
    // if (Math.abs(variation) < userpair.minVariation) {
    //   oResult.oper = "none";
    //   oResult.rule = oResult.rule + " / price variation smaller than min configured";
    // }
    return oResult;
  } catch (err) {
    console.log("Err stOne variationRules: ", err);
  }
}

function directionRules(previousResult, userpair) {
  try {
    let oResult = Object.assign({}, previousResult); //so I dont modify the input parameter obj
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

module.exports = {
  defineOperation: defineOperation,
  makeOrder: makeOrder
};

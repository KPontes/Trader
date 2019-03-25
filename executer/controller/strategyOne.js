const ctruser = require("../controller/user.js");
const ctrUserSymbol = require("../controller/userSymbol");
const ctrexchange = require("../controller/exchange.js");
const scrypto = require("../utils/simplecrypto.js");
const { User } = require("../models/user.js");
const { Trade } = require("../models/trade.js");
const sysconst = require("../utils/sysconst.js");

("use strict");

function makeOrder(shortOper, largeOper, user, index, currPrice, btcusdt) {
  return new Promise(async function(resolve, reject) {
    try {
      const userpair = user.monitor[index];
      const mode = userpair.mode;
      const exchange = user.exchange;
      const symbol = userpair.symbol;
      const ordertype = "MARKET";
      const operL = largeOper.oper;
      let operS = shortOper.oper;
      const log = shortOper.log;
      let upduser = await updateStopLoss(user, index, currPrice);
      let order = {};
      let orderMode = mode === "real" ? "real" : "test";
      if (operS !== "none") {
        const tk = scrypto.decrypt(user.tk, process.env.SYSPD);
        const sk = scrypto.decrypt(user.sk, process.env.SYSPD);
        let accinfo = await ctrexchange.accountInfo(exchange, tk, sk);
        let exchangeInfo = await ctrexchange.exchangeInfo(user.exchange);
        let amount = await ctrUserSymbol.getTradeAmount(
          user.role,
          userpair,
          accinfo,
          operS,
          currPrice,
          btcusdt,
          exchangeInfo
        );
        if (amount !== -1) {
          if (user.role !== "tracker") {
            order = await ctrexchange.putOrder(
              exchange,
              operS,
              symbol,
              ordertype,
              amount,
              0,
              mode,
              tk,
              sk
            );
            //console.log("**PUTORDER", order);
            if (mode === "real") {
              orderMode = "real";
              amount = order.executedQty;
              currPrice = order.fills[0].price;
            }
          } else orderMode = "tracker";
          let doc = await updUserPostOrder(operS, user, index, currPrice);
          if (["admin"].indexOf(user.role) !== -1) console.log("Trade", operS);
          let trd = await Trade.insert(
            user._id,
            exchange,
            symbol,
            ordertype,
            orderMode,
            operS,
            currPrice,
            amount,
            log
          );
        } else {
          // if there is no balance on one direction, update direction to none
          if (["admin"].indexOf(user.role) !== -1) console.log("**Direction updated to NONE");
          upduser = await User.findById(user._id);
          if (upduser) {
            upduser.monitor[index].lastDirection = "none";
            await upduser.save();
          }
        }
      }
      resolve(order);
    } catch (err) {
      console.log("Err makeOrder ", err);
      //TypeError [ERR_INVALID_CHAR]: Invalid character in header content ["X-MBX-APIKEY"]
      //if X-MBX-APIKEY in Err => set user activeOff
      reject(err);
    }
  });
}

function updateStopLoss(user, index, currPrice) {
  return new Promise(async function(resolve, reject) {
    try {
      const userpair = user.monitor[index];
      let upduser = await User.findById(user._id);
      //update stoploss topPrice
      if (
        currPrice > userpair.stopLoss.topPrice &&
        userpair.lastDirection.toLowerCase() === "buy"
      ) {
        if (upduser) {
          upduser.monitor[index].stopLoss = {
            topVariation: userpair.stopLoss.topVariation,
            bottomVariation: userpair.stopLoss.bottomVariation,
            topPrice: currPrice,
            bottomPrice: sysconst.MAXPRICE // Number.MAX_SAFE_INTEGER
          };
          await upduser.save();
        }
      }
      //update stoploss bottomPrice
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
            bottomPrice: sysconst.MAXPRICE //Number.MAX_SAFE_INTEGER
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

function defineOperationLarge(user, userpair, summary) {
  return new Promise(async function(resolve, reject) {
    try {
      let srules = summaryRules(userpair, summary);
      resolve({ oper: srules.oper, rule: srules.rule });
    } catch (err) {
      console.log("Err stOne defineOperationLarge: ", err);
      reject(err);
    }
  });
}

function defineOperationShort(user, userpair, summary, currPrice, largeOper, tradeLog) {
  return new Promise(async function(resolve, reject) {
    try {
      let srules = summaryRules(userpair, summary);
      tradeLog.summaryRules = Object.assign({}, srules);
      let vrules = variationRules(srules, userpair, currPrice, largeOper);
      tradeLog.variationRules = Object.assign({}, vrules);
      let drules = directionRules(vrules, userpair);
      tradeLog.directionRules = Object.assign({}, drules);
      if (["admin"].indexOf(user.role) !== -1) console.log("defineOperationShort", tradeLog);
      resolve({ oper: drules.oper, rule: drules.rule, log: tradeLog });
    } catch (err) {
      console.log("Err stOne defineOperationShort: ", err);
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
      if (summary.countBuy === summary.countSell) {
        return { oper, rule };
      } else {
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
    }
    return { oper, rule };
  } catch (err) {
    console.log("Err stOne summaryRules: ", err);
  }
}

function variationRules(previousResult, userpair, currPrice, largeOper) {
  try {
    let oResult = Object.assign({}, previousResult); //so I dont modify the input parameter obj
    let inputOper = oResult.oper;
    //treat stop loss variation to last top price
    let topVariation = (currPrice - userpair.stopLoss.topPrice) / userpair.stopLoss.topPrice;
    if (inputOper === "sell" && currPrice < userpair.stopLoss.topPrice) {
      if (Math.abs(topVariation) > userpair.stopLoss.topVariation) {
        oResult.oper = inputOper;
        oResult.rule = "stop loss away from resistance";
      } else {
        //on bearish market, sell fast
        if (currPrice < userpair.lastPrice * (1 + sysconst.TRADEFEE) && largeOper === inputOper) {
          oResult.oper = inputOper;
          oResult.rule = "stop loss recover last price";
        } else {
          oResult.oper = "none";
          oResult.rule = "price variation smaller than stop loss";
        }
      }
    }
    let bottomVariation =
      (currPrice - userpair.stopLoss.bottomPrice) / userpair.stopLoss.bottomPrice;
    if (inputOper === "buy" && currPrice > userpair.stopLoss.bottomPrice) {
      if (Math.abs(bottomVariation) > userpair.stopLoss.bottomVariation) {
        oResult.oper = inputOper;
        oResult.rule = "start gain away from support";
      } else {
        //on bullish market, buy fast
        if (currPrice > userpair.lastPrice * (1 - sysconst.TRADEFEE) && largeOper === inputOper) {
          oResult.oper = inputOper;
          oResult.rule = "start gain recover last price";
        } else {
          oResult.oper = "none";
          oResult.rule = "price variation smaller than start gain";
        }
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
    if (oResult.oper !== "none" && oResult.oper === userpair.lastDirection.toLowerCase()) {
      oResult.oper = "none";
      oResult.rule = "same direction as previous operation";
    }
    return oResult;
  } catch (err) {
    console.log("Err stOne directionRules: ", err);
  }
}

module.exports = {
  defineOperationShort: defineOperationShort,
  defineOperationLarge: defineOperationLarge,
  makeOrder: makeOrder
};

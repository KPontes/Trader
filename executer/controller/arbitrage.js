const _ = require("lodash");
const ctrexchange = require("../controller/exchange.js");
const ctrUserSymbol = require("../controller/userSymbol.js");
const scrypto = require("../utils/simplecrypto.js");
const { User } = require("../models/user.js");
const { Trade } = require("../models/trade.js");
const sysconst = require("../utils/sysconst.js");

("use strict");

function execute(reqobj) {
  return new Promise(async function(resolve, reject) {
    try {
      console.log("**reqobj", reqobj);
      let user = await User.findOne({ email: reqobj.email });
      if (!user) {
        throw "User not found";
      }
      const mode = "test";
      const maxUsd = 100; //** req.maxUsd ou buscar no user obj;
      const orderType = reqobj.orderType;
      const token = reqobj.token;
      const market1 = reqobj.market1;
      const market2 = reqobj.market2;
      let operIn = [
        {
          symbol: reqobj.oper1.symbol,
          oper: reqobj.oper1.oper
        },
        {
          symbol: reqobj.oper2.symbol,
          oper: reqobj.oper2.oper
        },
        {
          symbol: reqobj.oper3.symbol,
          oper: reqobj.oper3.oper
        }
      ];

      const tk = scrypto.decrypt(user.tk, process.env.SYSPD);
      const sk = scrypto.decrypt(user.sk, process.env.SYSPD);
      let exchangeInfo = await ctrexchange.exchangeInfo(user.exchange);
      let accInfo = await ctrexchange.accountInfo(user.exchange, tk, sk);
      let orderBook = await ctrexchange.bookTicker("binance");
      let arbiObj = await getArbiAmount(
        maxUsd,
        operIn,
        token,
        market1,
        market2,
        accInfo,
        orderBook,
        exchangeInfo
      );
      let order1 = {};
      let order2 = {};
      let order3 = {};
      order1 = await putOrder(user, arbiObj, 0, orderType, mode, tk, sk);
      if (mode === "test" || order1.status === "FILLED")
        order2 = await putOrder(user, arbiObj, 1, orderType, mode, tk, sk);
      if (mode === "test" || order2.status === "FILLED")
        order3 = await putOrder(user, arbiObj, 2, orderType, mode, tk, sk);
      console.log("**ORDERS", [order1, order2, order3]);
      resolve([order1, order2, order3]);
    } catch (err) {
      console.log("Err Arbi execute ", err);
      //TypeError [ERR_INVALID_CHAR]: Invalid character in header content ["X-MBX-APIKEY"]
      //if X-MBX-APIKEY in Err => set user activeOff
      reject(err);
    }
  });
}

function putOrder(user, arbiObj, ind, orderType, mode, tk, sk) {
  return new Promise(async function(resolve, reject) {
    try {
      let orderMode = "custom";
      let operation = arbiObj.operations[ind];
      let amount = operation.amount;
      let price = operation.price;
      order = await ctrexchange.putOrder(
        user.exchange,
        operation.oper,
        operation.symbol,
        orderType,
        operation.amount,
        operation.price,
        orderMode,
        tk,
        sk
      );
      // if (order.status !== "FILLED") { ** DESCOMENTAR
      //   resolve(order);
      // }

      if (mode === "real") {
        amount = order.executedQty;
        price = order.fills[0].price;
      }
      let trd = await Trade.insert(
        user._id,
        user.exchange,
        operation.symbol,
        orderType,
        orderMode,
        operation.oper,
        price,
        amount,
        order
      );
      if (["admin", "tracker"].indexOf(user.role) !== -1)
        console.log("Arbi Trade " + operation.symbol, operation.oper);

      resolve(order);
    } catch (err) {
      console.log("Err put ", err);
      //TypeError [ERR_INVALID_CHAR]: Invalid character in header content ["X-MBX-APIKEY"]
      //if X-MBX-APIKEY in Err => set user activeOff
      reject(err);
    }
  });
}

function getArbiAmount(maxUsd, operIn, token, market1, market2, accInfo, orderBook, exchangeInfo) {
  return new Promise(async function(resolve, reject) {
    try {
      let mkt1Balance = ctrUserSymbol.symbolBalance(market1, accInfo);
      let mkt2Balance = ctrUserSymbol.symbolBalance(market2, accInfo);
      let mkt1usdt = 1; //supose mkt1 = usdt
      if (market1 !== "USDT") {
        mkt1usdt = orderBook.find(
          doc =>
            doc.symbol === "BTCUSDT" && Number(doc.bidPrice) !== 0 && Number(doc.askPrice) !== 0
        );
      }
      let mkt2usdt = orderBook.find(
        doc =>
          doc.symbol === market2 + "USDT" &&
          Number(doc.bidPrice) !== 0 &&
          Number(doc.askPrice) !== 0
      );
      let tokenMkt1 = orderBook.find(
        doc =>
          doc.symbol === token + market1 && Number(doc.bidPrice) !== 0 && Number(doc.askPrice) !== 0
      );
      let tokenMkt2 = orderBook.find(
        doc =>
          doc.symbol === token + market2 && Number(doc.bidPrice) !== 0 && Number(doc.askPrice) !== 0
      );
      let mkt2mkt1 = orderBook.find(
        doc =>
          doc.symbol === market2 + market1 &&
          Number(doc.bidPrice) !== 0 &&
          Number(doc.askPrice) !== 0
      );
      let mkt1UsdAmount;
      let tokenAmount;
      let tradeUsdValue;
      if (tokenMkt1 && tokenMkt2 && mkt2mkt1) {
        if (market1 === "USDT") {
          mkt1UsdAmount = mkt1Balance[0].free < maxUsd ? mkt1Balance[0].free : maxUsd;
          tokenAmount = Math.min(
            tokenMkt1.askQty,
            tokenMkt1.bidQty,
            tokenMkt2.askQty,
            tokenMkt2.bidQty
          );
          if (tokenAmount * tokenMkt1.askPrice > mkt1UsdAmount) {
            tokenAmount = 0.95 * mkt1UsdAmount / tokenMkt1.askPrice;
          }
          tradeUsdValue = tokenAmount * tokenMkt1.askPrice;
        } else {
          mkt1UsdAmount =
            mkt1Balance[0].free * mkt1usdt.askPrice < maxUsd
              ? mkt1Balance[0].free * mkt1usdt.askPrice
              : maxUsd;
          tokenAmount = Math.min(
            tokenMkt1.askQty,
            tokenMkt1.bidQty,
            tokenMkt2.askQty,
            tokenMkt2.bidQty
          );

          if (tokenAmount * tokenMkt1.askPrice * mkt1usdt.askPrice > mkt1UsdAmount) {
            tokenAmount = 0.95 * mkt1UsdAmount / mkt1usdt.askPrice / tokenMkt1.askPrice;
          }
          tradeUsdValue = tokenAmount * mkt1usdt.askPrice * tokenMkt1.askPrice;
        }
      }

      let fullOper = operIn.map((element, i) => {
        if (element.symbol === token + market1) {
          element.amount = tokenAmount;
          element.price = element.oper === "buy" ? tokenMkt1.askPrice : tokenMkt1.bidPrice;
        }
        if (element.symbol === token + market2) {
          element.amount = tokenAmount;
          element.price = element.oper === "buy" ? tokenMkt2.askPrice : tokenMkt2.bidPrice;
        }
        if (element.symbol === market2 + market1) {
          element.amount = tokenAmount * tokenMkt2.askPrice;
          element.price = element.oper === "buy" ? mkt2mkt1.askPrice : mkt2mkt1.bidPrice;
        }
        let toRound = ctrexchange.lotSize(exchangeInfo, element.symbol);
        element.amount = _.round(element.amount, toRound);
        let minNotional = ctrexchange.minNotional(exchangeInfo, element.symbol);
        if (element.amount * element.symbol < minNotional) {
          throw "Err Min_Notional. Price * Qty too small " + element.symbol;
        }
        return element;
      });

      let mkt1USDT = market1 === "USDT" ? 1 : mkt1usdt.askPrice;

      let arbiObj = {
        token,
        market1,
        market2,
        tradeUsdValue: _.round(tradeUsdValue, 2),
        mkt1USDT,
        tokenMkt1,
        tokenMkt2,
        mkt2mkt1,
        operations: fullOper
      };
      console.log("**arbiObj", arbiObj);
      resolve(arbiObj);
    } catch (err) {
      console.log("Err getArbiAmount ", err);
      reject(err);
    }
  });
}

module.exports = {
  execute: execute
};

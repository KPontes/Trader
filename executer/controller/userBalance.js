const _ = require("lodash");
const moment = require("moment");

const scrypto = require("../utils/simplecrypto.js");
const ctrtrade = require("./trade.js");
const ctrexchange = require("./exchange.js");
const { User } = require("../models/user.js");
const { LoaderSettings } = require("../models/loaderSettings.js");
const { Balance } = require("../models/balance.js");

("use strict");

function add(requestobj) {
  return new Promise(async function(resolve, reject) {
    try {
      let oneuser = await User.findOne({ email: requestobj.email });
      if (!oneuser) {
        throw "email not found";
      }
      let tk = scrypto.decrypt(oneuser.tk, process.env.SYSPD);
      let sk = scrypto.decrypt(oneuser.sk, process.env.SYSPD);
      //now with keys, get initial balance
      let balanceArr = await calcBalance(oneuser.exchange, tk, sk);
      let balance = new Balance();
      balance.userId = oneuser._id;
      balance.exchange = oneuser.exchange;
      balance.balance = balanceArr;
      await balance.save();
      resolve(balance);
    } catch (err) {
      console.log("Err addBalance: ", err);
      reject(err);
    }
  });
}

function get(requestobj) {
  return new Promise(async function(resolve, reject) {
    try {
      let oneuser = await User.findOne({ email: requestobj.email });
      if (!oneuser) {
        throw "email not found";
      }
      let tk = scrypto.decrypt(oneuser.tk, process.env.SYSPD);
      let sk = scrypto.decrypt(oneuser.sk, process.env.SYSPD);
      //now with keys, get initial balance
      let balanceArr = await calcBalance(oneuser.exchange, tk, sk);
      resolve(balanceArr);
    } catch (err) {
      console.log("Err getBalance: ", err);
      reject(err);
    }
  });
}

function list(requestobj) {
  return new Promise(async function(resolve, reject) {
    try {
      let oneuser = await User.findOne({ email: requestobj.email });
      if (!oneuser) {
        throw "email not found";
      }
      let balances = await Balance.find({ userId: oneuser._id })
        .sort({ createdAt: -1 })
        .exec();
      if (!balances) {
        throw "No balance snapshot saved";
      }
      resolve(balances);
    } catch (err) {
      console.log("Err listBalance: ", err);
      reject(err);
    }
  });
}

function del(requestobj) {
  return new Promise(async function(resolve, reject) {
    try {
      let balance = await Balance.findOneAndDelete({ _id: requestobj.balanceId });
      if (!balance) {
        throw "No balance snapshot deleted";
      }
      resolve(balance);
    } catch (err) {
      console.log("Err delBalance: ", err);
      reject(err);
    }
  });
}

function calcBalance(exchange, tk, sk) {
  return new Promise(async function(resolve, reject) {
    try {
      //get account Info from exchange, priceList and LoaderSettings
      let accInfo = await ctrexchange.accountInfo(exchange, tk, sk);
      let priceList = await ctrtrade.getSymbolPricesAPI();
      let settings = await LoaderSettings.findOne({ exchange });
      //extract unique token names from pairs
      let symbols = settings.symbols
        .map(element => {
          let len = element.length;
          let market = element.slice(-4) === "USDT" ? "USDT" : "BTC";
          let token = element.substr(0, len - market.length);
          return [market, token];
        })
        .flat();
      //determine balance for each asset, in USD and BTC
      let assets = _.uniq(symbols);
      let balance = [];
      let usdtValue;
      let btcValue;
      let btcUsdt = priceList.find(doc => doc.symbol === "BTCUSDT");
      for (let element of assets) {
        let amount = accInfo.balances.find(item => {
          if (item.asset === element) {
            return item.free;
          }
        });
        if (element === "USDT") {
          usdtValue = amount.free;
          btcValue = usdtValue / Number(btcUsdt.value);
        } else {
          let price = priceList.find(doc => doc.symbol === element + "USDT");
          usdtValue = Number(price.value) * Number(amount.free);
          btcValue = Number(btcUsdt.value) === 0 ? 0 : usdtValue / Number(btcUsdt.value);
        }
        balance.push({
          asset: element,
          amount: amount.free,
          USD: _.round(usdtValue, 2),
          BTC: _.round(btcValue, 4)
        });
      }

      let totUsd = balance.reduce((acc, curr) => acc + curr.USD, 0);
      let totBtc = balance.reduce((acc, curr) => acc + curr.BTC, 0);
      balance.push({ asset: "Total", amount: 0, USD: totUsd, BTC: totBtc });
      resolve(balance);
    } catch (err) {
      console.log("Err calcBalance: ", err);
      reject(err);
    }
  });
}

module.exports = {
  add: add,
  get: get,
  list: list,
  del: del
};

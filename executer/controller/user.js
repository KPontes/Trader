const _ = require("lodash");
const moment = require("moment");

const smail = require("../utils/sendmail.js");
const scrypto = require("../utils/simplecrypto.js");
const ctrtrade = require("./trade.js");
const ctrexchange = require("./exchange.js");
const ctrusersymbol = require("./userSymbol.js");
const { User, UserPair } = require("../models/user.js");
const { LoaderSettings } = require("../models/loaderSettings.js");

("use strict");

function add(requestobj) {
  return new Promise(async function(resolve, reject) {
    try {
      let newuser = new User();
      //newuser.password = scrypto.createhash(requestobj.password.trim());
      newuser.password = requestobj.password.trim();
      newuser.username = requestobj.username.trim();
      newuser.email = requestobj.email.trim();
      newuser.exchange = requestobj.exchange.trim();
      newuser.validtil = moment().add(1, "month");
      await newuser.save();
      newuser = await createValidation(newuser._id);
      let usersymbol = ctrusersymbol.add({
        email: newuser.email,
        usedefault: true,
        symbol: "BTCUSDT"
      });
      resolve(newuser);
    } catch (err) {
      console.log("Err user add: ", err);
      reject(err);
    }
  });
}

function createValidation(userid) {
  return new Promise(async function(resolve, reject) {
    try {
      newuser = await User.findOne({ _id: userid });
      let token = await smail.sendValidationMail(newuser);
      newuser.validation = token;
      await newuser.save();
      resolve(newuser);
    } catch (err) {
      console.log("Err createValidation: ", err);
      reject(err);
    }
  });
}

function updateKeys(requestobj) {
  return new Promise(async function(resolve, reject) {
    try {
      let theuser = await User.findOne({ email: requestobj.email });
      if (!theuser) {
        throw "email not found";
      }
      if (requestobj.tk && requestobj.sk) {
        theuser.tk = scrypto.encrypt(requestobj.tk, process.env.SYSPD);
        theuser.sk = scrypto.encrypt(requestobj.sk, process.env.SYSPD);
      }
      //now with keys, get initial balance
      let balance = await calcBalance(theuser.exchange, "sum", requestobj.tk, requestobj.sk);
      theuser.initBalance = { USD: balance.USD, BTC: balance.BTC };
      await theuser.save();
      resolve(theuser);
    } catch (err) {
      console.log("Err updateKeys: ", err);
      reject(err);
    }
  });
}

function calcBalance(exchange, mode, tk, sk) {
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
      //return detail or summary
      if ((mode = "sum")) {
        let totUsd = balance.reduce((acc, curr) => acc + curr.USD, 0);
        let totBtc = balance.reduce((acc, curr) => acc + curr.BTC, 0);
        resolve({ USD: totUsd, BTC: totBtc });
      } else {
        resolve(balance);
      }
    } catch (err) {
      console.log("Err calcBalance: ", err);
      reject(err);
    }
  });
}

function play(reqobj) {
  return new Promise(async function(resolve, reject) {
    try {
      let oneuser = await User.findOne({ email: reqobj.email });
      if (!oneuser) {
        throw "email not found";
      }
      let action = reqobj.action === "start" ? "activeOn" : "activeOff";
      //perform validations
      let msg = "OK";
      if (oneuser.monitor.length === 0) msg = "No tokens configured";
      if (oneuser.tk.length < 64 || oneuser.sk.length < 64) msg = "No API Keys configured";
      if (oneuser.status === "registered") msg = "User email not validated";
      if (oneuser.validtil < new Date()) msg = "Plan validity expired";
      if (msg !== "OK") {
        throw msg;
      }
      oneuser.status = action;
      await oneuser.save();
      resolve(oneuser);
    } catch (err) {
      console.log("Err createValidation: ", err);
      reject(err);
    }
  });
}

module.exports = {
  play: play,
  add: add,
  updateKeys: updateKeys,
  createValidation: createValidation
};

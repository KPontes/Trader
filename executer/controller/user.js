const _ = require("lodash");
const moment = require("moment");

const scrypto = require("../utils/simplecrypto.js");
const ctrexchange = require("./exchange.js");
const { User, UserPair } = require("../models/user.js");

("use strict");

function getBalance(exchange, symbol, tk, sk) {
  return new Promise(async function(resolve, reject) {
    try {
      //recebe resultado e filtra pelo symbol
      let accinfo = await ctrexchange.accountInfo(exchange, tk, sk);
      let amount = accinfo.balances.filter(element => {
        if (element.asset === symbol.substring(0, element.asset.length)) {
          return element;
        }
      });
      resolve(Number(amount[0].free));
    } catch (err) {
      console.log("Err user getBalance: ");
      reject(err);
    }
  });
}

function save(requestobj) {
  return new Promise(async function(resolve, reject) {
    try {
      let newuser = new User();
      newuser.password = scrypto.createhash(requestobj.password.trim());
      newuser.name = requestobj.name.trim();
      newuser.email = requestobj.email.trim();
      newuser.exchange = requestobj.exchange.trim();
      newuser.validtil = moment().add(1, "month");
      if (requestobj.tk && requestobj.sk) {
        newuser.tk = scrypto.encrypt(requestobj.tk, process.env.SYSPD);
        newuser.sk = scrypto.encrypt(requestobj.sk, process.env.SYSPD);
      }
      await newuser.save();
      resolve(newuser);
    } catch (err) {
      console.log("Err user save: ", err);
      reject(err);
    }
  });
}

function saveSymbol(requestobj) {
  return new Promise(async function(resolve, reject) {
    try {
      let theuser = await User.findOne({ email: requestobj.email });
      if (!theuser) {
        throw "email not found";
      }
      let userSymbols = theuser.monitor.filter(element => {
        if (element.symbol === requestobj.symbol.trim()) {
          return element;
        }
      });
      if (userSymbols.length > 0) {
        throw "symbol already listed";
      }
      let userpair = new UserPair();
      userpair.symbol = requestobj.symbol.trim();
      userpair.strategy = requestobj.strategy.trim();
      userpair.schedule = requestobj.schedule;
      userpair.period = requestobj.period;
      userpair.maxAmount = requestobj.maxamount;
      userpair.minVariation = requestobj.minvariation;
      userpair.summaryRule = {
        count: requestobj.summarycount,
        factor: requestobj.summaryfactor
      };
      userpair.stopLoss = {
        topVariation: requestobj.stoploss,
        topPrice: 0.0001,
        bottomVariation: requestobj.stoploss * 2,
        bottomPrice: Number.MAX_SAFE_INTEGER
      };
      let configcalc = {};
      let configrule = {};
      Object.entries(requestobj).map(element => {
        if (element[0].substring(0, 5) === "calc-") {
          configcalc[element[0].substring(5)] = element[1];
        }
        if (element[0].substring(0, 5) === "rule-") {
          configrule[element[0].substring(5)] = element[1];
        }
      });
      userpair.configcalc = configcalc;
      userpair.configrule = configrule;
      theuser.monitor.push(userpair);
      await theuser.save();
      resolve(theuser);
    } catch (err) {
      console.log("Err user saveSymbol: ", err);
      reject(err);
    }
  });
}

module.exports = {
  save: save,
  saveSymbol: saveSymbol,
  getBalance: getBalance
};

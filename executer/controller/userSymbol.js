const _ = require("lodash");
const moment = require("moment");

const { User, UserPair } = require("../models/user.js");
const { LoaderSettings } = require("../models/loaderSettings.js");

("use strict");

const defaultConfig = {
  calc_sma: [4, 7, 25, 99],
  calc_rsi: [14],
  calc_bbands: [20],
  calc_macd: [12, 26, 9],
  calc_klines: [1],
  rule_sma: [],
  rule_rsi: [30, 70, 7],
  rule_bbands: [100],
  rule_macd: [],
  rule_klines: [0.005]
};

function addSymbol(requestobj) {
  return new Promise(async function(resolve, reject) {
    //add both, default configuration or post request symbol
    try {
      let oneuser = await User.findOne({ email: requestobj.email });
      if (!oneuser) {
        throw "email not found";
      }

      let userSymbols = oneuser.monitor.filter(element => {
        if (element.symbol === requestobj.symbol) {
          return element;
        }
      });
      if (userSymbols.length > 0) {
        throw "symbol already listed";
      }
      let validated = await validateSymbol(oneuser.monitor, requestobj.symbol, oneuser.exchange);
      if (!validated) {
        throw "Invalid symbol or mixed markets";
      }
      let userpair = new UserPair();
      if (!requestobj.usedefault) {
        userpair.symbol = requestobj.symbol.trim();
        userpair.strategy = requestobj.strategy.trim();
        userpair.mode = requestobj.mode;
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
      }

      let oConfig = requestobj.usedefault ? defaultConfig : requestobj;
      let configcalc = {};
      let configrule = {};
      Object.entries(oConfig).map(element => {
        if (element[0].substring(0, 5) === "calc_") {
          configcalc[element[0].substring(5)] = element[1];
        }
        if (element[0].substring(0, 5) === "rule_") {
          configrule[element[0].substring(5)] = element[1];
        }
      });
      userpair.configcalc = configcalc;
      userpair.configrule = configrule;
      oneuser.monitor.push(userpair);
      await oneuser.save();
      resolve(oneuser);
    } catch (err) {
      console.log("Err user addSymbol: ", err);
      reject(err);
    }
  });
}

function validateSymbol(monitor, symbol, exchange) {
  return new Promise(async function(resolve, reject) {
    try {
      //verify if BTC is in USDT market
      let btcusdt = monitor.filter(element => {
        if (element.symbol === "BTCUSDT") {
          return element;
        }
      });
      //verify if there is use of BTC market
      let btcmarket = monitor.filter(element => {
        let market = element.symbol.substring(element.symbol.length - 3);
        if (market === "BTC") {
          return element;
        }
      });
      console.log("new", symbol);
      let newsymbolMkt = symbol.substring(symbol.length - 3);
      if (btcmarket.length > 0 && btcusdt.length > 0) {
        return resolve(false);
      }
      if (newsymbolMkt === "BTC" && btcusdt.length > 0) {
        return resolve(false);
      }
      loader = await LoaderSettings.findOne({ exchange });
      let ind = loader.symbols.findIndex(doc => doc === symbol);
      if (ind === -1) {
        return resolve(false);
      }
      resolve(true);
    } catch (err) {
      console.log("Err user changeSymbol: ", err);
      reject(err);
    }
  });
}

function changeSymbol(requestobj) {
  return new Promise(async function(resolve, reject) {
    try {
      let oneuser = await User.findOne({ email: requestobj.email });
      if (!oneuser) {
        throw "email not found";
      }
      let userSymbols = oneuser.monitor.filter(element => {
        if (element.symbol === requestobj.newsymbol) {
          return element;
        }
      });
      if (userSymbols.length > 0) {
        throw "New symbol already listed";
      }
      let validated = await validateSymbol(oneuser.monitor, requestobj.newsymbol, oneuser.exchange);
      if (!validated) {
        throw "Invalid symbol or mixed markets";
      }
      let monit = oneuser.monitor;
      let ind = monit.findIndex(doc => doc.symbol === requestobj.oldsymbol);
      oneuser.monitor[ind].symbol = requestobj.newsymbol;
      await oneuser.save();
      resolve(oneuser);
    } catch (err) {
      console.log("Err user changeSymbol: ", err);
      reject(err);
    }
  });
}

module.exports = {
  addSymbol: addSymbol,
  changeSymbol: changeSymbol
};

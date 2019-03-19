const _ = require("lodash");
const moment = require("moment");

const { User, UserPair } = require("../models/user.js");
const { LoaderSettings } = require("../models/loaderSettings.js");
const sysconst = require("../utils/sysconst.js");

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

function add(requestobj) {
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
      if (oneuser.role === "user" && oneuser.monitor.length >= oneuser.comercial.maxSymbols) {
        throw "Maximum amount of symbols reached";
      }
      if (userSymbols.length > 0) {
        throw "symbol already listed";
      }
      let validated = await validateSymbol(oneuser.monitor, requestobj.symbol, oneuser.exchange);
      if (!validated) {
        throw "Invalid symbol or mixed markets";
      }
      let userpair = new UserPair();
      userpair.symbol = requestobj.symbol.trim();
      if (!requestobj.usedefault) {
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

function del(requestobj) {
  return new Promise(async function(resolve, reject) {
    try {
      let oneuser = await User.findOne({ email: requestobj.email });
      if (!oneuser) {
        throw "email not found";
      }
      let ind = oneuser.monitor.findIndex(doc => doc.symbol === requestobj.symbol);
      if (ind === -1) {
        throw "Symbol not found";
      }
      if (oneuser.monitor.length <= 1) {
        throw "Must have at least one token";
      }
      oneuser.monitor.splice(ind, 1);
      await oneuser.save();
      resolve(oneuser);
    } catch (err) {
      console.log("Err delSymbol: ", err);
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

function updateNumbers(requestobj) {
  return new Promise(async function(resolve, reject) {
    try {
      let oneuser = await User.findOne({ email: requestobj.email });
      if (!oneuser) {
        throw "email not found";
      }
      let ind = oneuser.monitor.findIndex(doc => doc.symbol === requestobj.symbol);
      if (ind === -1) {
        throw "Symbol not found";
      }
      let userpair = oneuser.monitor[ind];
      if (requestobj.topVariation && requestobj.bottomVariation) {
        oneuser.monitor[ind].stopLoss = {
          topVariation: requestobj.topVariation,
          bottomVariation: requestobj.bottomVariation,
          topPrice: userpair.stopLoss.topPrice,
          bottomPrice: userpair.stopLoss.bottomPrice
        };
      }
      if (requestobj.maxValue) {
        oneuser.monitor[ind].maxAmount = {
          selector: requestobj.maxSelector,
          value: requestobj.maxValue
        };
      }
      let resUser = await oneuser.save();
      resolve(resUser);
    } catch (err) {
      console.log("Err updateNumbers: ", err);
      reject(err);
    }
  });
}

function symbolBalance(symbol, accinfo) {
  return accinfo.balances.filter(element => {
    if (element.asset === symbol.substring(0, element.asset.length)) {
      return element;
    }
  });
}

function getTradeAmount(role, userpair, accInfo, oper, currPrice, btcusdt) {
  return new Promise(async function(resolve, reject) {
    try {
      if (role === "tracker") {
        //arbitrary value, as does not matter
        return resolve(5);
      }

      let balance;
      let tokenToTrade;
      let symbolAmount;
      let marketAmount;
      let usdTradeValue;
      let market = userpair.symbol.slice(-4) === "USDT" ? "USDT" : "BTC";
      if (oper === "buy") {
        let len = userpair.symbol.length;
        tokenToTrade = userpair.symbol.substr(0, len - market.length);
        //when buying a token, check availability of market (USDT or BTC) balance
        balance = symbolBalance(market, accInfo);
        if (userpair.maxAmount.selector === "PERCENT") {
          //uses a maximum of 90% or the specified maxamount
          let percent = userpair.maxAmount.value > 90 ? 0.9 : userpair.maxAmount.value / 100;
          marketAmount = Number(balance[0].free) * percent;
          if (market === "USDT") {
            usdTradeValue = marketAmount;
            //How many tokens = available usd amount div token usd price
            symbolAmount = marketAmount / currPrice; //in Token
          } else {
            usdTradeValue = marketAmount * btcusdt;
            //How many tokens = available btc amount div token btc price
            symbolAmount = marketAmount / currPrice; //in Token
          }
        }
        if (userpair.maxAmount.selector === "USD") {
          let usdMax = userpair.maxAmount.value;
          marketAmount = Number(balance[0].free) * 0.9;
          if (market === "USDT") {
            let usdBalance = marketAmount;
            marketAmount = usdBalance > usdMax ? usdMax : usdBalance; //in USDT
            usdTradeValue = marketAmount;
            symbolAmount = marketAmount / currPrice; //in Token
          } else {
            //get balance value available in BTC, but respecting maxValue defined inUSDT
            let usdBalance = marketAmount * btcusdt;
            marketAmount = usdBalance > usdMax ? usdMax / btcusdt : usdBalance / btcusdt; //in BTC
            usdTradeValue = marketAmount * btcusdt;
            symbolAmount = marketAmount / currPrice; //in Token
          }
        }
      } else {
        //sell is from a token to USDT or BTC market. On sell uses total availability
        balance = symbolBalance(userpair.symbol, accInfo);
        tokenToTrade = balance[0].asset;
        symbolAmount = Number(balance[0].free) * 0.9;
        if (market === "USDT") {
          usdTradeValue = symbolAmount * currPrice;
        } else {
          usdTradeValue = symbolAmount * currPrice * btcusdt;
        }
      }
      let toRound =
        sysconst.SYMBOLROUND[tokenToTrade] !== undefined ? sysconst.SYMBOLROUND[tokenToTrade] : 1;
      symbolAmount = _.round(symbolAmount, toRound);
      if (usdTradeValue < sysconst.USD_MIN_TRADE) symbolAmount = -1;

      // console.log("**market", market);
      // console.log("**marketAmount", marketAmount);
      // console.log("**btcusdt", btcusdt);
      // console.log("**tokenToTrade", tokenToTrade);
      // console.log("**symbolAmount", symbolAmount);
      // console.log("**usdTradeValue", usdTradeValue);

      resolve(symbolAmount);
    } catch (err) {
      console.log("Err user getTradeAmount: ");
      reject(err);
    }
  });
}

module.exports = {
  add: add,
  del: del,
  changeSymbol: changeSymbol,
  updateNumbers: updateNumbers,
  getTradeAmount: getTradeAmount,
  symbolBalance: symbolBalance
};

const _ = require("lodash");
const moment = require("moment");

const smail = require("../utils/sendmail.js");
const scrypto = require("../utils/simplecrypto.js");
const ctrexchange = require("./exchange.js");
const ctrusersymbol = require("./userSymbol.js");
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
      await theuser.save();
      resolve(theuser);
    } catch (err) {
      console.log("Err updateKeys: ", err);
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
  getBalance: getBalance,
  createValidation: createValidation
};

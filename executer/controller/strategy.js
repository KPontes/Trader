const _ = require("lodash");

const { Strategy } = require("../models/strategy.js");

("use strict");

var _this = this;

function saveConfig(requestobj) {
  return new Promise(async function(resolve, reject) {
    try {
      var strat = new Strategy();
      strat.name = requestobj.name;
      strat.exchange = requestobj.exchange;
      strat.symbol = requestobj.pair;
      strat.period = requestobj.period;
      //map remaining fields into config
      let newobj = {};
      Object.entries(requestobj).map(element => {
        if (["name", "exchange", "pair", "period"].indexOf(element[0]) === -1) {
          newobj[element[0]] = element[1];
        }
      });
      strat.config = newobj;
      await strat.save();
      resolve(strat);
    } catch (err) {
      console.log("Err saveConfig: ", err);
      reject(err);
    }
  });
}

function saveResult(name, exchange, symbol, period, config, result, summary) {
  return new Promise(async function(resolve, reject) {
    try {
      const stgArr = await Strategy.find({ name, exchange, symbol, period });
      //from the result set, find a matching configuration
      let foundId;
      let match = false;
      for (let stg of stgArr) {
        if (!match) {
          foundId = stg._id;
          match = true;
        }
        Object.keys(stg.config).forEach(key => {
          let stgvalue = stg.config[key];
          let cfgvalue = config[key];
          if (!Array.isArray(stgvalue)) {
            if (config[key] !== stgvalue) {
              match = false;
            }
          } else {
            if (_.xor(stgvalue, cfgvalue).length > 0) {
              match = false;
            }
          }
        });
      }
      if (!match) {
        throw "Not configured strategy" + name;
      }
      let stg = await Strategy.findById(foundId);
      stg.lastresult = result;
      stg.lastsummary = summary;
      await stg.save();
      resolve(stg);
    } catch (err) {
      console.log("Err saveResult: ", err);
      reject(err);
    }
  });
}

module.exports = {
  saveConfig: saveConfig,
  saveResult: saveResult
};

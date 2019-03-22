const _ = require("lodash");

const { Strategy } = require("../models/strategy.js");
const { Indicator } = require("../models/indicator.js");

("use strict");

var _this = this;

function saveConfig(requestobj) {
  return new Promise(async function(resolve, reject) {
    try {
      //validate against saved indicators
      var strat = new Strategy();
      strat.name = requestobj.name;
      strat.exchange = requestobj.exchange;
      strat.symbol = requestobj.pair;
      strat.period = requestobj.period;
      //map remaining fields into config
      let configcalc = {};
      let configrule = {};
      Object.entries(requestobj).map(element => {
        if (element[0].substring(0, 5) === "calc-") {
          let key = element[0].substring(5);
          configcalc[key] = element[1];
        }
        if (element[0].substring(0, 5) === "rule-") {
          let key = element[0].substring(5);
          configrule[key] = element[1];
        }
      });
      strat.configcalc = configcalc;
      strat.configrule = configrule;
      let gosave = await validateConfig(configcalc, requestobj.period);
      if (gosave) {
        await strat.save();
      } else {
        throw "Err Config not validated against allowed indicators";
      }
      resolve(strat);
    } catch (err) {
      console.log("Err saveConfig: ", err);
      reject(err);
    }
  });
}

function validateConfig(oConfig, period) {
  return new Promise(async function(resolve, reject) {
    try {
      //validate input config-calc against saved DB indicators
      //there is one doc per indicator per period on BD
      const indicator = await Indicator.find({ period });
      match = true;
      Object.keys(oConfig).forEach(key => {
        let cfgCalcValues = oConfig[key];
        let indicrow = indicator.filter(element => {
          if (element.name.toLowerCase() === key.toLowerCase()) {
            return element;
          }
        });
        if (indicrow.length === 0) match = false;
        //now validate the values within the found algorithm key
        cfgCalcValues.map(item => {
          if (_.indexOf(indicrow[0].params, item.toString()) === -1) {
            match = false;
          }
        });
      });
      resolve(match);
    } catch (err) {
      console.log("Err validateConfig: ", err);
      reject(err);
    }
  });
}

function saveResultById(id, result, summary, retry) {
  return new Promise(async function(resolve, reject) {
    var trySave = async function(attempts) {
      try {
        const stg = await Strategy.findById(id);
        if (!stg) {
          throw "Not configured strategy" + name;
        }
        stg.lastresult = result;
        stg.lastsummary = summary;
        await stg.save();
        resolve(stg);
      } catch (e) {
        if (attempts == 0) {
          reject(e);
        } else {
          setTimeout(async function() {
            await trySave(attempts - 1);
          }, 1000);
        }
      }
    };
    await trySave(retry);
  });
}

// function saveResultById(id, result, summary) {
//   return new Promise(async function(resolve, reject) {
//     try {
//       const stg = await Strategy.findById(id);
//       if (!stg) {
//         throw "Not configured strategy" + name;
//       }
//       stg.lastresult = result;
//       stg.lastsummary = summary;
//       await stg.save();
//       resolve(stg);
//     } catch (err) {
//       console.log("Err saveResultById: ", err);
//       reject(err);
//     }
//   });
// }

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
        Object.keys(stg.configcalc).forEach(key => {
          let stgvalue = stg.configcalc[key];
          let cfgvalue = config.calc[key];
          if (_.xor(stgvalue, cfgvalue).length > 0) {
            match = false;
          }
        });
        Object.keys(stg.configrule).forEach(key => {
          let stgvalue = stg.configrule[key];
          let cfgvalue = config.rule[key];
          if (_.xor(stgvalue, cfgvalue).length > 0) {
            match = false;
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
  saveResult: saveResult,
  saveResultById: saveResultById
};

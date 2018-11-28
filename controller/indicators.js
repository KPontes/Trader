const { Indicator } = require("../models/indicator.js");
const { IndicatorLoader, Base } = require("../models/indicatorLoader.js");

("use strict");

var _this = this;

function saveIndicators(obj) {
  return new Promise(async function(resolve, reject) {
    try {
      if (obj.action === "drop") {
        await Indicator.collection.drop();
      } else {
        await Indicator.deleteMany({ period: obj.period });
      }
      await saveItem(obj.smaName, obj.period, obj.smaParams);
      await saveItem(obj.emaName, obj.period, obj.emaParams);
      await saveItem(obj.klinesName, obj.period, "1");
      await saveItem(obj.rsiName, obj.period, obj.rsiParams);
      await saveItem(obj.macdName, obj.period, obj.macdParams);
      await saveItem(obj.bbandsName, obj.period, obj.bbandsParams);
      resolve("OK");
    } catch (err) {
      console.log("Err saveIndicator: ", err);
      reject(err);
    }
  });
}

function saveItem(_name, _period, _params) {
  return new Promise(async function(resolve, reject) {
    try {
      function validate(_params) {
        params.map(element => {
          return parseInt(element);
        });
      }
      let params = [];
      var idc = new Indicator();
      idc.name = _name;
      idc.period = _period;
      params = _params.split(",");
      validate(params);
      idc.params = params;
      await idc.save();
      resolve(idc);
    } catch (err) {
      console.log("Err indicator saveItem: ", err);
      reject(err);
    }
  });
}

function saveLoad(_exchange, _pair, _loadPeriod, _name, loader) {
  return new Promise(async function(resolve, reject) {
    try {
      var iLoader = new IndicatorLoader();
      console.log("begin saveLoad");
      iLoader.symbol = _pair;
      iLoader.period = _loadPeriod;
      iLoader.exchange = _exchange;
      iLoader.name = _name;
      switch (_name) {
        case "KLines":
          iLoader.docs = await prepareSaveKlines(loader.klines);
          break;
        case "SMA":
          iLoader.docs = await prepareSave("sma", loader.sma);
          break;
        case "EMA":
          iLoader.docs = await prepareSave("ema", loader.ema);
          break;
        case "RSI":
          iLoader.docs = await prepareSave("rsi", loader.rsi);
          break;
        case "MACD":
          iLoader.docs = await prepareSave("macd", loader.macd);
          break;
        case "BBANDS":
          iLoader.docs = await prepareSave("bbands", loader.bbands);
          break;
        default:
          console.log("wrong name on saveLoad", _name);
      }
      await iLoader.save();
      resolve(iLoader);
    } catch (err) {
      console.log("Err indicator saveLoad: ", err);
      reject(err);
    }
  });
}

function prepareSave(name, data) {
  return new Promise(async function(resolve, reject) {
    try {
      var arr = [];
      for (let i = 0; i < data.length; i++) {
        let newDoc = {};
        newDoc.params = data[i].params;
        newDoc.data = data[i].data;
        arr.push(newDoc);
      }
      resolve(arr);
    } catch (err) {
      console.log(`Err prepareSave ${name}:`, err);
      reject(err);
    }
  });
}

function prepareSaveKlines(klData) {
  return new Promise(async function(resolve, reject) {
    try {
      var arr = [];
      let newDoc = {};
      newDoc.params = "1";
      newDoc.data = klData.data;
      arr.push(newDoc);
      resolve(arr);
    } catch (err) {
      console.log("Err prepareSave Klines:", err);
      reject(err);
    }
  });
}

module.exports = {
  saveIndicators: saveIndicators,
  saveLoad: saveLoad
};

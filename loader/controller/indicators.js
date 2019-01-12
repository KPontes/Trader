const { Indicator } = require("../models/indicator.js");
const { ILoader } = require("../models/indicatorLoader.js");

("use strict");

var _this = this;

function saveIndicators(req) {
  return new Promise(async function(resolve, reject) {
    try {
      var obj = {
        action: req.body.action,
        period: req.body.period,
        smaName: req.body.smaName,
        smaParams: req.body.smaParams,
        emaName: req.body.emaName,
        emaParams: req.body.emaParams,
        klinesName: req.body.klinesName,
        rsiName: req.body.rsiName,
        rsiParams: req.body.rsiParams,
        macdName: req.body.macdName,
        macdParams: req.body.macdParams,
        bbandsName: req.body.bbandsName,
        bbandsParams: req.body.bbandsParams
      };
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

function saveLoad(exchange, symbol, period, name, loader) {
  return new Promise(async function(resolve, reject) {
    try {
      var iloader = await ILoader.findOne({ exchange, symbol, period, name });
      if (!iloader) {
        iloader = new ILoader();
        iloader.symbol = symbol;
        iloader.period = period;
        iloader.exchange = exchange;
        iloader.name = name;
        iloader.docs = [];
      }

      switch (name) {
        case "KLines":
          iloader.docs = await prepareSaveKlines(loader.klines);
          break;
        case "SMA":
          iloader.docs = await prepareSave("sma", loader.sma);
          break;
        case "EMA":
          iloader.docs = await prepareSave("ema", loader.ema);
          break;
        case "RSI":
          iloader.docs = await prepareSave("rsi", loader.rsi);
          break;
        case "MACD":
          iloader.docs = await prepareSave("macd", loader.macd);
          break;
        case "BBANDS":
          iloader.docs = await prepareSave("bbands", loader.bbands);
          break;
        default:
          console.log("wrong name on saveLoad", name);
      }
      await iloader.save();
      resolve(iloader);
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

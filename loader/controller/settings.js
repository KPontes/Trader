const { LoaderSettings } = require("../models/loaderSettings.js");

("use strict");

function save(req) {
  return new Promise(async function(resolve, reject) {
    try {
      var obj = {
        action: req.body.action,
        exchange: req.body.exchange,
        symbols: req.body.symbols,
        periods: req.body.periods
      };
      await LoaderSettings.deleteOne({ exchange: obj.exchange });
      if (obj.action === "save") {
        setting = new LoaderSettings();
        setting.exchange = obj.exchange;
        setting.symbols = obj.symbols;
        setting.periods = obj.periods;
        await setting.save();
      }
      resolve(setting);
    } catch (err) {
      console.log("Err settings save: ", err);
      reject(err);
    }
  });
}

module.exports = {
  save: save
};

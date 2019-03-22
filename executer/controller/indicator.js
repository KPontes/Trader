const { Indicator } = require("../models/indicator.js");

("use strict");

function list(reqobj) {
  return new Promise(async function(resolve, reject) {
    try {
      let period = reqobj.period;
      let indicator = await Indicator.find({ period });
      resolve(indicator);
    } catch (err) {
      console.log("Err indicator list ");
      reject(err);
    }
  });
}

module.exports = {
  list: list
};

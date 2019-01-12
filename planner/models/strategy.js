const mongoose = require("mongoose");

var StrategySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      trim: true
    },
    exchange: {
      type: String,
      required: true,
      minlength: 3,
      trim: true
    },
    symbol: {
      type: String,
      required: true,
      minlength: 6,
      trim: true
    },
    period: {
      type: String,
      required: true
    },
    configcalc: mongoose.Schema.Types.Mixed,
    configrule: mongoose.Schema.Types.Mixed,
    lastresult: mongoose.Schema.Types.Mixed,
    lastsummary: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

StrategySchema.statics.getMany = async function() {
  return new Promise(async function(resolve, reject) {
    try {
      const stList = await Strategy.find();
      resolve(stList);
    } catch (err) {
      console.log("Err getMany strategy: ", err);
      reject(err);
    }
  });
};

var Strategy = mongoose.model("Strategy", StrategySchema);

module.exports = { Strategy };

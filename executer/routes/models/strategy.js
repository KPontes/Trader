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
    config: mongoose.Schema.Types.Mixed,
    lastresult: mongoose.Schema.Types.Mixed,
    lastsummary: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

var Strategy = mongoose.model("Strategy", StrategySchema);

module.exports = { Strategy };

const mongoose = require("mongoose");

var StrategySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    value: String
  },
  {
    timestamps: true
  }
);

var Strategy = mongoose.model("Strategy", StrategySchema);

module.exports = { Strategy };

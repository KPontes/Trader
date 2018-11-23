const mongoose = require("mongoose");

var IndicatorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      trim: true
    },
    period: {
      type: String,
      required: true
    },
    params: [String]
  },
  {
    timestamps: true
  }
);

var Indicator = mongoose.model("Indicator", IndicatorSchema);

module.exports = { Indicator };

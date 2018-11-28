const mongoose = require("mongoose");

var IndicatorLoaderSchema = new mongoose.Schema(
  {
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
    name: {
      type: String,
      required: true,
      minlength: 3,
      trim: true
    },
    docs: [
      {
        params: String,
        data: []
      }
    ]
  },
  {
    timestamps: true
  }
);

var IndicatorLoader = mongoose.model("IndicatorLoader", IndicatorLoaderSchema);

module.exports = { IndicatorLoader };

// var KLineDataSchema = new mongoose.Schema({
//   openTime: Number,
//   open: Number,
//   high: Number,
//   low: Number,
//   close: Number,
//   volume: Number,
//   closeTime: Number,
//   numberOf: Number
// });
//
// var RSIDataSchema = new mongoose.Schema({
//   close: Number,
//   change: Number,
//   gain: Number,
//   loss: Number,
//   avgGain: Number,
//   avgLoss: Number,
//   rs: Number,
//   rsi: Number
// });

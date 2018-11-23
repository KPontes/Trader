const mongoose = require("mongoose");

var BaseSchema = new mongoose.Schema({
  params: String,
  data: []
});

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
    klines: [BaseSchema],
    rsi: [BaseSchema],
    sma: [BaseSchema],
    ema: [BaseSchema],
    rsi: [BaseSchema],
    macd: [BaseSchema],
    bbands: [BaseSchema]
  },
  {
    timestamps: true
  }
);

var IndicatorLoader = mongoose.model("IndicatorLoader", IndicatorLoaderSchema);
var Base = mongoose.model("Base", BaseSchema);

module.exports = { IndicatorLoader, Base };

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

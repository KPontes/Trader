const mongoose = require("mongoose");

// this is for workaround on the lack of atomicity of multidocs transactions on Mongodb
var BalanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    exchange: {
      type: String,
      required: true,
      minlength: 3,
      trim: true
    },
    balance: {
      type: mongoose.Schema.Types.Mixed,
      default: { USD: 0, BTC: 0 }
    }
  },
  {
    timestamps: true
  }
);

var Balance = mongoose.model("Balance", BalanceSchema);

module.exports = { Balance };

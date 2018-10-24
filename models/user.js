const mongoose = require("mongoose");

const LastOrderState = Object.freeze({
  buy: "buy",
  sell: "sell",
  none: "none"
});

var UserSchema = new mongoose.Schema(
  {
    pairs: {
      type: String,
      required: true,
      minlength: 6,
      trim: true
    },
    indicators: {
      type: String,
      required: true,
      minlength: 3,
      trim: true
    },
    email: {
      type: String,
      required: true
    },
    lastSide: {
      type: String,
      enum: Object.values(LastOrderState),
      default: none
    },
    tkey: {
      type: String,
      minlength: 64,
      maxlength: 64
    }
  },
  {
    timestamps: true
  }
);

Object.assign(UserSchema.statics, {
  LastOrderState
});

var User = mongoose.model("User", UserSchema);

module.exports = { User };

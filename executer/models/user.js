const mongoose = require("mongoose");

const OrderDirection = Object.freeze({
  buy: "buy",
  sell: "sell",
  none: "none"
});

var UserPairSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    minlength: 6,
    trim: true
  },
  schedule: { type: [Number], default: [1] },
  lastDirection: {
    type: String,
    enum: Object.values(OrderDirection),
    default: OrderDirection.none
  },
  minVariation: { type: Number, default: 0.003 },
  lastPrice: Number
});

var UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    tkey: {
      type: String,
      minlength: 64,
      maxlength: 64
    },
    monitor: [UserPairSchema]
  },
  {
    timestamps: true
  }
);

Object.assign(UserPairSchema.statics, {
  OrderDirection
});

var User = mongoose.model("User", UserSchema);

module.exports = { User };

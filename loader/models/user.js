const mongoose = require("mongoose");

const OrderDirection = Object.freeze({
  buy: "buy",
  sell: "sell",
  none: "none"
});

const UserStatus = Object.freeze({
  activeOn: "activeOn",
  activeOff: "activeOff",
  disabled: "disabled",
  deleted: "deleted"
});

var UserPairSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    minlength: 6,
    trim: true
  },
  strategy: {
    type: String,
    required: true,
    default: "StrategyOne"
  },
  period: {
    type: String,
    required: true,
    default: "1m"
  },
  configcalc: mongoose.Schema.Types.Mixed,
  configrule: mongoose.Schema.Types.Mixed,
  summaryRule: {
    type: mongoose.Schema.Types.Mixed,
    default: { count: "unanimous", factor: "3" }
  },
  schedule: { type: [Number], default: [1] },
  maxAmount: { type: Number, default: 0 },
  lastDirection: {
    type: String,
    enum: Object.values(OrderDirection),
    default: OrderDirection.none
  },
  minVariation: { type: Number, default: 0.005 },
  lastPrice: { type: Number, default: 0.0001 },
  stopLoss: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      topVariation: 0.005,
      topPrice: 0.0001,
      bottomVariation: 0.01,
      bottomPrice: Number.MAX_SAFE_INTEGER
    }
  }
});

var UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    exchange: {
      type: String,
      required: true,
      minlength: 3,
      trim: true
    },
    tk: {
      type: String
    },
    sk: {
      type: String
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.activeOff
    },
    validtil: {
      type: Date,
      required: true
    },
    monitor: { type: [UserPairSchema], default: [] }
  },
  {
    timestamps: true
  }
);

Object.assign(UserPairSchema.statics, {
  OrderDirection
});

Object.assign(UserSchema.statics, {
  UserStatus
});

var User = mongoose.model("User", UserSchema);
var UserPair = mongoose.model("UserPair", UserPairSchema);

module.exports = { User, UserPair };

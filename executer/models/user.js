const mongoose = require("mongoose");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const scrypto = require("../utils/simplecrypto.js");
const _ = require("lodash");
const bcrypt = require("bcryptjs");

const maxPrice = 999999999999;
const OrderDirection = Object.freeze({
  buy: "buy",
  sell: "sell",
  none: "none"
});

const AmountSelector = Object.freeze({
  USD: "USD",
  PERCENT: "PERCENT"
});

const UserStatus = Object.freeze({
  activeOn: "activeOn",
  activeOff: "activeOff",
  registered: "registered",
  validated: "validated",
  deleted: "deleted"
});

var UserPairSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      minlength: 6,
      trim: true,
      default: "BTCUSDT"
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
    largeInterval: {
      type: String,
      default: "1h"
    },
    mode: {
      type: String,
      enum: ["test", "real"],
      required: true,
      default: "test"
    },
    configcalc: mongoose.Schema.Types.Mixed,
    configrule: mongoose.Schema.Types.Mixed,
    summaryRule: {
      type: mongoose.Schema.Types.Mixed,
      default: { count: "unanimous", factor: "3" }
    },
    schedule: { type: [Number], default: 100 },
    maxAmount: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        selector: AmountSelector.PERCENT,
        value: 100
      }
    },
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
        bottomPrice: maxPrice //Number.MAX_SAFE_INTEGER
      }
    }
  },
  {
    timestamps: true
  }
);

var UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true
    },
    username: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ["user", "admin", "tracker"],
      required: true,
      default: "user"
    },
    tokens: [
      {
        access: {
          type: String,
          required: true
        },
        token: {
          type: String,
          required: true
        },
        createdAt: {
          type: Date,
          default: new Date()
        }
      }
    ],
    exchange: {
      type: String,
      required: true,
      minlength: 3,
      trim: true
    },
    tk: {
      type: String,
      default: ""
    },
    sk: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.registered
    },
    comercial: {
      type: mongoose.Schema.Types.Mixed,
      default: { plan: "FREE", maxSymbols: 1, priceUSD: 0, payInterval: 0, tradesLimit: 90 }
    },
    initBalance: {
      type: mongoose.Schema.Types.Mixed,
      default: { USD: 0, BTC: 0 }
    },
    validation: { type: String, default: "" },
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

UserSchema.methods.toJSON = function() {
  //Override the method to prevent the Object from sending properties that we do not want
  //Allow only picked properties
  var user = this;
  var userObject = user.toObject(); //cast the mongoose user to a regular Object
  return _.omit(userObject, ["password", "tokens"]);
};

UserSchema.methods.generateAuthToken = function() {
  var user = this;
  var access = "auth";
  var token = jwt.sign({ _id: user._id.toHexString(), access }, process.env.SYSPD).toString();

  user.tokens.push({ access, token });
  // or  user.tokens = user.tokens.concat([{access, token}]);

  return user.save().then(() => {
    return token;
  });
};

UserSchema.methods.removeToken = async function(token) {
  let deletedDocs = await User.updateMany({
    $pull: {
      tokens: {
        createdAt: { $lt: moment().subtract(1, "day") }
      }
    }
  });
  deletedDocs = await User.updateMany({
    $pull: {
      tokens: {
        token: token
      }
    }
  });
  return deletedDocs;
};

UserSchema.statics.findByValidation = async function(token) {
  try {
    var user = await User.findOne({ validation: token.toString().trim(), status: "registered" });
    if (!user) {
      return false;
    }
    if (scrypto.comparehash(user._id.toString(), token)) {
      user.validation = "";
      user.status = UserStatus.validated;
      await user.save();
      return true;
    }
    return false;
  } catch (e) {
    return Promise.reject("email validation error", e);
  }
};

UserSchema.statics.findByToken = function(token) {
  //this is a Model method instead of instance method.
  var User = this; //uppercase as for model methods
  var decoded;
  try {
    decoded = jwt.verify(token, process.env.SYSPD);
  } catch (e) {
    return Promise.reject("token validation error");
  }
  return User.findOne({
    _id: decoded._id,
    "tokens.token": token,
    "tokens.access": "auth"
  });
};

UserSchema.statics.findByCredentials = function(email, password) {
  //this is a Model method instead of instance method.
  var User = this; //uppercase as for model methods
  return User.findOne({ email }).then(user => {
    if (!User) {
      return Promise.reject();
    }
    //as bcrypt does not implement promises, I envelop the method call into one new promise
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user);
        } else {
          reject();
        }
      });
    });
  });
};

UserSchema.pre("save", function(next) {
  var user = this;
  if (user.isModified("password")) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

var User = mongoose.model("User", UserSchema);
var UserPair = mongoose.model("UserPair", UserPairSchema);

module.exports = { User, UserPair };

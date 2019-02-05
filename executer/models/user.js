const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const bcrypt = require("bcryptjs");

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
      required: true,
      minlength: 6
    },
    role: {
      type: String,
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

UserSchema.methods.toJSON = function() {
  //Override the method to prevent the Object from sending properties that we do not want
  //Allow only picked properties
  var user = this;
  var userObject = user.toObject(); //cast the mongoose user to a regular Object
  return _.omit(userObject, ["password", "tokens", "tk", "sk"]);
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

UserSchema.methods.removeToken = function(token) {
  var user = this;
  return user.update({
    $pull: {
      tokens: {
        token: token
      }
    }
  });
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

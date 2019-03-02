const mongoose = require("mongoose");

// this is for workaround on the lack of atomicity of multidocs transactions on Mongodb
var TradeSchema = new mongoose.Schema(
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
    symbol: {
      type: String,
      required: true,
      minlength: 6,
      trim: true
    },
    orderId: { type: String, required: true },
    orderType: { type: String, enum: ["MARKET", "LIMIT"], required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    side: { type: String, enum: ["BUY", "SELL"], required: true },
    log: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: true
  }
);

// statics, class method
TradeSchema.statics.insert = async function(
  userId,
  exchange,
  symbol,
  orderType,
  orderId,
  side,
  price,
  quantity,
  log
) {
  return new Promise(async function(resolve, reject) {
    try {
      let trade = new Trade();
      trade.userId = userId;
      trade.exchange = exchange;
      trade.symbol = symbol;
      trade.orderType = orderType.toUpperCase();
      trade.orderId = orderId;
      trade.side = side.toUpperCase();
      trade.price = price;
      trade.quantity = quantity;
      trade.log = log;
      await trade.save();
      resolve(trade);
    } catch (err) {
      console.log("Err trade insert: ", err);
      reject(err);
    }
  });
};

var Trade = mongoose.model("Trade", TradeSchema);

module.exports = { Trade };

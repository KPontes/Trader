const mongoose = require("mongoose");

var PricesSchema = new mongoose.Schema(
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
    value: Number
  },
  {
    timestamps: true
  }
);

// statics, class method
PricesSchema.statics.upsert = async function(exchange, symbol, value) {
  return new Promise(async function(resolve, reject) {
    try {
      element = await Prices.updateOne(
        { exchange: exchange, symbol: symbol },
        { value: value },
        { upsert: true }
      );
      resolve(element);
    } catch (err) {
      console.log("Err upsert price: ", err);
      reject(err);
    }
  });
};

PricesSchema.statics.saveMany = async function(exchange, pairs, priceList) {
  return new Promise(async function(resolve, reject) {
    try {
      let shortList = priceList.filter(element => {
        return pairs.indexOf(element.symbol) !== -1;
      });
      for (let element of shortList) {
        let saved = await Prices.upsert(exchange, element.symbol, Number(element.price));
      }
      console.log("Price shortList", shortList);
      resolve(shortList);
    } catch (err) {
      console.log("Err saveMany price: ", err);
      reject(err);
    }
  });
};

PricesSchema.statics.getMany = async function() {
  return new Promise(async function(resolve, reject) {
    try {
      const priceList = await Prices.find();
      resolve(priceList);
    } catch (err) {
      console.log("Err getMany price: ", err);
      reject(err);
    }
  });
};

var Prices = mongoose.model("Prices", PricesSchema);

module.exports = { Prices };

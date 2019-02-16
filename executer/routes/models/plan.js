const mongoose = require("mongoose");

const { LoaderSettings } = require("./loaderSettings.js");

var PlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 3,
      trim: true
    },
    exchange: {
      type: String,
      required: true,
      minlength: 3,
      trim: true
    },
    symbols: [
      {
        type: String,
        required: true,
        minlength: 6,
        trim: true
      }
    ],
    periods: [
      {
        type: String,
        required: true
      }
    ],
    message: { type: String, required: true },
    maxSymbols: {
      type: Number,
      required: true,
      default: 1
    },
    maxAmount: {
      type: Number,
      required: true,
      default: 1
    },
    monthPrice: { type: Number, required: true },
    quarterPrice: { type: Number, required: true },
    halfPrice: { type: Number, required: true },
    yearPrice: { type: Number, required: true }
  },
  {
    timestamps: true
  }
);

PlanSchema.statics.save = async function(requestplan) {
  return new Promise(async function(resolve, reject) {
    try {
      let setting = await LoaderSettings.findOne({ exchange: requestplan.exchange });
      if (!setting) throw "Error exchange not valid";
      await Plan.deleteOne({ name: requestplan.name });
      if (requestplan.action === "save") {
        // let validsymbols = requestplan.symbols.every(elem => setting.symbols.includes(elem));
        // if (!validsymbols) throw "Error symbol not valid";
        let plan = new Plan();
        plan.name = requestplan.name;
        plan.exchange = requestplan.exchange;
        plan.symbols = setting.symbols;
        plan.periods = setting.periods;
        plan.message = requestplan.message;
        plan.maxSymbols = requestplan.maxSymbols;
        plan.maxAmount = requestplan.maxAmount;
        plan.monthPrice = requestplan.monthPrice;
        plan.quarterPrice = requestplan.quarterPrice;
        plan.halfPrice = requestplan.halfPrice;
        plan.yearPrice = requestplan.yearPrice;
        plan.save();
        return resolve(plan);
      }
      resolve("deleted plan " + requestplan.name);
    } catch (err) {
      console.log("Err save plan: ", err);
      reject(err);
    }
  });
};

var Plan = mongoose.model("Plan", PlanSchema);

module.exports = { Plan };

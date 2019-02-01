const mongoose = require("mongoose");

var LoaderSettingsSchema = new mongoose.Schema(
  {
    exchange: {
      type: String,
      required: true,
      minlength: 3,
      trim: true,
      unique: true
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
        required: true,
        trim: true
      }
    ]
  },
  {
    timestamps: true
  }
);

var LoaderSettings = mongoose.model("LoaderSettings", LoaderSettingsSchema);

module.exports = { LoaderSettings };

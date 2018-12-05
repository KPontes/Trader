const mongoose = require("mongoose");

var SignalizerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    value: String
  },
  {
    timestamps: true
  }
);

// statics, class method
SignalizerSchema.statics.upsert = async function(name, value) {
  return new Promise(async function(resolve, reject) {
    try {
      element = await Signalizer.updateOne(
        { name: name },
        { value: value },
        { upsert: true }
      );
      resolve(element);
    } catch (err) {
      console.log("Err upsert: ", err);
      reject(err);
    }
  });
};

var Signalizer = mongoose.model("Signalizer", SignalizerSchema);

module.exports = { Signalizer };

var mongoose = require("mongoose");

// mongodb://user:pwd@url:port/dbname
const REMOTE_MONGO =
  "mongodb://dev:1234@ds125628.mlab.com:25628/ponteskl-futuresprd";
const LOCAL_MONGO = process.env.MONGODB_URI; //was set through config.json
const MONGO_URI = process.env.PORT == 5000 ? LOCAL_MONGO : REMOTE_MONGO;
mongoose.Promise = global.Promise;
const options = {
  reconnectTries: 10, // Never stop trying to reconnect
  reconnectInterval: 1000, // Reconnect every 1000ms
  poolSize: 10, // Maintain up to 10 socket connections
  // If not connected, return errors immediately rather than waiting for reconnect
  bufferMaxEntries: 0,
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  socketTimeoutMS: 35000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
};
mongoose.connect(MONGO_URI, options);
// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on("connected", function() {
  console.log("Mongoose default connection open ");
});

// If the connection throws an error
mongoose.connection.on("error", function(err) {
  console.log("Mongoose default connection error: " + err);
});

// When the connection is disconnected
mongoose.connection.on("disconnected", function() {
  console.log("Mongoose default connection disconnected");
});

module.exports = { mongoose };

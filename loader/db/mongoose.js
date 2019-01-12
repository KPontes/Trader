var mongoose = require("mongoose");

const {
  NODE_ENV,
  ATLAS1,
  MONGO_USERNAME,
  MONGO_PASSWORD,
  MONGO_HOSTNAME,
  MONGO_PORT,
  MONGO_DATABASE_NAME
} = process.env;

let MONGO_URI;
if (NODE_ENV === "production") {
  MONGO_URI = process.env.ATLAS1;
} else {
  //Connection URL Docker
  MONGO_URI = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DATABASE_NAME}`;
  // Connection URL VM
  // MONGO_URI = `mongodb://localhost:${MONGO_PORT}/${MONGO_DATABASE_NAME}`; //connect into local VM
  // Connection
  // const MONGO_URI =
  //   "mongodb://atradeuser:GhynxerLage2506@clusteraperium0-shard-00-00-itv7k.mongodb.net:27017,clusteraperium0-shard-00-01-itv7k.mongodb.net:27017,clusteraperium0-shard-00-02-itv7k.mongodb.net:27017/AperiumTrader?ssl=true&replicaSet=ClusterAperium0-shard-0&authSource=admin&retryWrites=true";
}
mongoose.Promise = global.Promise;
const options = {
  reconnectTries: 10, // 0= Never stop trying to reconnect
  reconnectInterval: 1000, // Reconnect every 1000ms
  poolSize: 10, // Maintain up to 10 socket connections
  // If not connected, return errors immediately rather than waiting for reconnect
  bufferMaxEntries: 0,
  connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
  socketTimeoutMS: 35000, // Close sockets after 35 seconds of inactivity
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

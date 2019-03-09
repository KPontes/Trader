//require("dotenv").config({ path: "~/Projects/chart-trader/" });
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { mongoose } = require("./db/mongoose.js");

const Monitor = require("./controller/monitor.js");
const ctrIndicators = require("./controller/indicators.js");
const ctrSettings = require("./controller/settings.js");
const ctrArbitrage = require("./controller/arbitrage.js");
const { Prices } = require("./models/prices");

const app = express();

app.use(bodyParser.json());

app.get("/express", (req, res) => {
  console.log("welcome message");
  res.send({ message: "Welcome to docker chart-trader loader Express Server" });
});

process.env["BASEPATH"] = __dirname;
// if (process.env.NODE_ENV === "production") {
//   app.use(express.static("client/build"));
//   // Express will serve up the index.html file
//   // if it doesn't recognize the route
//   const path = require("path");
//   app.get("*", (req, res) => {
//     res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
//   });
// }

var monitor = new Monitor(60000);
app.post("/loader", async (req, res) => {
  try {
    monitor.pooling();
    console.log("Started Loader Pooling");
    //var result = await monitor.executeLoader();
    res.status(200).send("OK started loader monitor");
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

app.post("/addindicators", async (req, res) => {
  try {
    var result = await ctrIndicators.saveIndicators(req);
    res.status(200).send(result);
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

app.post("/addsetting", async (req, res) => {
  try {
    var result = await ctrSettings.save(req);
    res.status(200).send(result);
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

app.get("/getsymbolprices", async (req, res) => {
  try {
    var result = await Prices.getMany();
    res.status(200).send(result);
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

app.post("/arbitrage", async (req, res) => {
  try {
    var result = await ctrArbitrage.execute();
    res.status(200).send(result);
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

app.post("/stop", async (req, res) => {
  try {
    var result = monitor.stop();
    res.send(result);
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

app.get("/healthz", function(req, res) {
  // do app logic here to determine if app is truly healthy
  // you should return 200 if healthy, and anything else will fail
  // if you want, you should be able to restrict this to localhost (include ipv4 and ipv6)
  res.status(200).send("I am a happy and healthy loader\n");
});

module.exports = app;

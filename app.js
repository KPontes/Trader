require("dotenv").config();
const _ = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");
const { mongoose } = require("./db/mongoose.js");
const MongoClient = require("mongodb").MongoClient;

const Monitor = require("./controller/monitor.js");
const ctrIndicators = require("./controller/indicators.js");
// Create a new MongoClient
// const MONGODB_URI = "mongodb://admin:dev123PWD@mymongo:27017";
// let db;
// const client = new MongoClient(MONGODB_URI);
// setTimeout(() => {
//   client.connect(function(err) {
//     if (err) {
//       return console.error(err);
//     }
//     console.log("Connected MongoClient to database");
//     db = client.db("AperiumTrader");
//   });
// }, 2000);

const app = express();

app.use(bodyParser.json());

app.get("/express", (req, res) => {
  console.log("welcome message");
  res.send({ message: "Welcome to docker chart-trader Express Server" });
});

process.env["BASEPATH"] = __dirname;

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  // Express will serve up the index.html file
  // if it doesn't recognize the route
  const path = require("path");
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

var monitor = new Monitor(30000);
app.post("/monitor", async (req, res) => {
  try {
    var result = await monitor.pooling();
    res.status(200).send(result);
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

app.post("/addindicators", async (req, res) => {
  try {
    var obj = {
      action: req.body.action,
      period: req.body.period,
      smaName: req.body.smaName,
      smaParams: req.body.smaParams,
      emaName: req.body.emaName,
      emaParams: req.body.emaParams,
      klinesName: req.body.klinesName,
      rsiName: req.body.rsiName,
      rsiParams: req.body.rsiParams,
      macdName: req.body.macdName,
      macdParams: req.body.macdParams,
      bbandsName: req.body.bbandsName,
      bbandsParams: req.body.bbandsParams
    };
    var result = await ctrIndicators.saveIndicators(obj);
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

app.post("/oneload", async (req, res) => {
  try {
    var result = await monitor.executeLoader();
    res.status(200).send(result);
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

app.get("/healthz", function(req, res) {
  // do app logic here to determine if app is truly healthy
  // you should return 200 if healthy, and anything else will fail
  // if you want, you should be able to restrict this to localhost (include ipv4 and ipv6)
  res.status(200).send("I am happy and healthy\n");
});

module.exports = app;

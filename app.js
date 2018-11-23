require("dotenv").config();
const _ = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");

const Monitor = require("./controller/monitor.js");
const ctrIndicators = require("./controller/indicators.js");
const app = express();

app.use(bodyParser.json());

app.get("/express", (req, res) => {
  res.send({ message: "Welcome to chart-trader Express Server" });
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

app.post("/monitor", async (req, res) => {
  try {
    var monitor = new Monitor(5000);
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

app.get("/healthz", function(req, res) {
  // do app logic here to determine if app is truly healthy
  // you should return 200 if healthy, and anything else will fail
  // if you want, you should be able to restrict this to localhost (include ipv4 and ipv6)
  res.status(200).send("I am happy and healthy\n");
});

app.post("/test", async (req, res) => {
  try {
    var result = await ctrIndicators.saveLoad();
    res.status(200).send(result);
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

module.exports = app;

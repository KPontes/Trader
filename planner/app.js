require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { mongoose } = require("./db/mongoose.js");

const monitor = require("./controller/monitor.js");
const strategy = require("./controller/strategy.js");
const { Strategy } = require("./models/strategy.js");

const app = express();

app.use(bodyParser.json());
process.env["BASEPATH"] = __dirname;

app.get("/express", (req, res) => {
  console.log("planner welcome message");
  res.send({
    message: "Welcome to docker planner chart-trader Express Server"
  });
});

app.post("/strategyconfig", async (req, res) => {
  try {
    var result = await strategy.saveConfig(req.body);
    res.status(200).send(result);
  } catch (e) {
    console.log("Error: ", e.response.data);
    console.log(e.response.statusText);
    res.status(400).send(e.response.data);
  }
});

app.post("/getstrategyresults", async (req, res) => {
  try {
    var result = await monitor.execute(req.body);
    //var result = await Strategy.getMany();
    res.status(200).send(result);
  } catch (e) {
    console.log("app Error: ", e);
    res.status(400).send(e);
  }
});

app.get("/healthz", function(req, res) {
  // do app logic here to determine if app is truly healthy
  // you should return 200 if healthy, and anything else will fail
  // if you want, you should be able to restrict this to localhost (include ipv4 and ipv6)
  res.status(200).send("I am a happy and healthy planner\n");
});

module.exports = app;

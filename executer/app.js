require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");

const { mongoose } = require("./db/mongoose.js");
const Monitor = require("./controller/monitor.js");
const user = require("./controller/user.js");

const app = express();

app.use(bodyParser.json());

app.get("/express", (req, res) => {
  console.log("executer welcome message");
  res.send({
    message: "Welcome to docker executer chart-trader Express Server"
  });
});

process.env["BASEPATH"] = __dirname;
//console.log("process.env", process.env);

var monitor = new Monitor(60000);
app.post("/executer", async (req, res) => {
  try {
    //var result = await monitor.execute();
    await monitor.pooling();
    res.status(200).send("OK started executer monitor");
  } catch (e) {
    console.log(`app Error: ${e.response.status} - ${e.response.statusText} - ${e.response.data}`);
    res.status(400).send(e.response.data);
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

app.post("/adduser", async (req, res) => {
  try {
    var result = await user.save(req.body);
    res.status(200).send(result);
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

app.post("/addusersymbol", async (req, res) => {
  try {
    var result = await user.saveSymbol(req.body);
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
  res.status(200).send("I am a happy and healthy executer\n");
});

module.exports = app;

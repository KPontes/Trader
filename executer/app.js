require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const { mongoose } = require("./db/mongoose.js");
const Monitor = require("./controller/monitor.js");
const ctruser = require("./controller/user.js");
const { Plan } = require("./models/plan.js");
const { LoaderSettings } = require("./models/loaderSettings.js");
var { authenticate } = require("./middleware/authenticate.js");
var userRoutes = require("./routes/user-routes.js");
var userSymbolRoutes = require("./routes/userSymbol-routes.js");
var tradeRoutes = require("./routes/trade-routes.js");

const app = express();

app.use(bodyParser.json());
app.use(function(req, res, next) {
  //enable CORS
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, x-Requested-With, Content-Type, Accept, x-auth"
  );
  res.header("Access-Control-Expose-Headers", "x-auth");
  res.header("Access-Control-Allow-Methods", "POST, GET, DELETE, PATCH");
  next();
});
app.use("/user", userRoutes);
app.use("/usersymbol", userSymbolRoutes);
app.use("/trade", tradeRoutes);

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

app.post("/addplan", async (req, res) => {
  try {
    var result = await Plan.save(req.body);
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

app.get("/getsetting", async (req, res) => {
  try {
    var loader = await LoaderSettings.findOne({ exchange: req.query.exchange });
    var loaderObject = loader.toObject();
    res.status(200).send(loaderObject);
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

app.get("/getplans", async (req, res) => {
  try {
    var plan = await Plan.find().sort("monthPrice");
    //var planObject = plan.toObject();
    res.status(200).send(plan);
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

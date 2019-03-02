var express = require("express");
var router = express.Router();
const _ = require("lodash");

const monitor = require("../controller/monitor.js");
const { Plan } = require("../models/plan.js");
//var { authenticate } = require("../middleware/authenticate.js");

router.post("/execute", async (req, res) => {
  try {
    var result = await monitor.execute(req.body);
    res.status(200).send(result);
  } catch (e) {
    let returnErr = new Error();
    returnErr.message = e;
    res.status(400).send(returnErr);
  }
});

router.post("/addplan", async (req, res) => {
  try {
    var result = await Plan.save(req.body);
    res.status(200).send(result);
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

router.get("/getplans", async (req, res) => {
  try {
    var plan = await Plan.find().sort("monthPrice");
    //var planObject = plan.toObject();
    res.status(200).send(plan);
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

module.exports = router;

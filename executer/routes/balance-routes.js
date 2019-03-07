var express = require("express");
var router = express.Router();
const _ = require("lodash");

const { User } = require("../models/user.js");
const ctruserBalance = require("../controller/userBalance.js");
var { authenticate } = require("../middleware/authenticate.js");

router.post("/add", authenticate, async (req, res) => {
  try {
    var result = await ctruserBalance.add(req.body);
    res.status(200).send(result);
  } catch (e) {
    let returnErr = new Error();
    returnErr.message = e;
    res.status(400).send(returnErr);
  }
});

router.post("/get", authenticate, async (req, res) => {
  try {
    var result = await ctruserBalance.get(req.body);
    res.status(200).send(result);
  } catch (e) {
    let returnErr = new Error();
    returnErr.message = e;
    res.status(400).send(returnErr);
  }
});

router.delete("/del", authenticate, async (req, res) => {
  try {
    var result = await ctruserBalance.del(req.body);
    res.status(200).send(result);
  } catch (e) {
    let returnErr = new Error();
    returnErr.message = e;
    res.status(400).send(returnErr);
  }
});

router.post("/list", authenticate, async (req, res) => {
  try {
    var result = await ctruserBalance.list(req.body);
    res.status(200).send(result);
  } catch (e) {
    let returnErr = new Error();
    returnErr.message = e;
    res.status(400).send(returnErr);
  }
});

module.exports = router;

var express = require("express");
var router = express.Router();
const _ = require("lodash");

const { User } = require("../models/user.js");
const ctrUserSymbol = require("../controller/userSymbol.js");
var { authenticate } = require("../middleware/authenticate.js");

router.post("/add", authenticate, async (req, res) => {
  try {
    var result = await ctrUserSymbol.add(req.body);
    res.status(200).send(result);
  } catch (e) {
    let returnErr = new Error();
    returnErr.message = e;
    res.status(400).send(returnErr.message);
  }
});

router.delete("/del", authenticate, async (req, res) => {
  try {
    var result = await ctrUserSymbol.del(req.body);
    res.status(200).send(result);
  } catch (e) {
    let returnErr = new Error();
    returnErr.message = e;
    res.status(400).send(returnErr);
  }
});

router.post("/changesymbol", authenticate, async (req, res) => {
  try {
    var result = await ctrUserSymbol.changeSymbol(req.body);
    res.status(200).send(result);
  } catch (e) {
    let returnErr = new Error();
    returnErr.message = e;
    res.status(400).send(returnErr);
  }
});

router.patch("/numbers", authenticate, async (req, res) => {
  try {
    var result = await ctrUserSymbol.updateNumbers(req.body);
    res.status(200).send(result);
  } catch (e) {
    let returnErr = new Error();
    returnErr.message = e;
    res.status(400).send(returnErr);
  }
});

router.patch("/updatealgo", authenticate, async (req, res) => {
  try {
    var result = await ctrUserSymbol.updateAlgoParams(req.body);
    res.status(200).send(result);
  } catch (e) {
    let returnErr = new Error();
    returnErr.message = e;
    res.status(400).send(returnErr);
  }
});

module.exports = router;

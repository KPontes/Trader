var express = require("express");
var router = express.Router();
const _ = require("lodash");

const { Trades } = require("../models/trade.js");
const ctrtrade = require("../controller/trade.js");
var { authenticate } = require("../middleware/authenticate.js");

router.post("/list", authenticate, async (req, res) => {
  try {
    var result = await ctrtrade.list(req.body);
    res.status(200).send(result);
  } catch (e) {
    let returnErr = new Error();
    returnErr.message = e;
    res.status(400).send(returnErr);
  }
});

module.exports = router;

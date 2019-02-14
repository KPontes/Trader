var express = require("express");
var router = express.Router();
const _ = require("lodash");

const { User } = require("../models/user.js");
const ctrUserSymbol = require("../controller/userSymbol.js");
var { authenticate } = require("../middleware/authenticate.js");

router.post("/add", authenticate, async (req, res) => {
  try {
    var result = await ctrUserSymbol.addSymbol(req.body);
    res.status(200).send(result);
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

router.post("/changesymbol", authenticate, async (req, res) => {
  try {
    var result = await ctrUserSymbol.changeSymbol(req.body);
    res.status(200).send(result);
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

module.exports = router;

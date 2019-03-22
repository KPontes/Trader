var express = require("express");
var router = express.Router();

const ctrIndicator = require("../controller/indicator.js");

router.get("/list", async (req, res) => {
  try {
    var result = await ctrIndicator.list(req.query);
    res.status(200).send(result);
  } catch (e) {
    let returnErr = new Error();
    returnErr.message = e;
    res.status(400).send(returnErr);
  }
});

module.exports = router;

var express = require("express");
var router = express.Router();

const ctrArbi = require("../controller/arbitrage.js");
var { authenticate } = require("../middleware/authenticate.js");

router.post("/command", authenticate, async (req, res) => {
  try {
    var result = await ctrArbi.execute(req.body);
    res.status(200).send(result);
  } catch (e) {
    let returnErr = new Error();
    returnErr.message = e;
    res.status(400).send(returnErr);
  }
});

module.exports = router;

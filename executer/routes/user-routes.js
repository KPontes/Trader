var express = require("express");
var router = express.Router();
const _ = require("lodash");

const { User } = require("../models/user.js");
const ctruser = require("../controller/user.js");
var { authenticate } = require("../middleware/authenticate.js");

router.post("/login", (req, res) => {
  var body = _.pick(req.body, ["email", "password"]);
  User.findByCredentials(body.email, body.password)
    .then(user => {
      return user.generateAuthToken().then(token => {
        res.header("x-auth", token).send(user);
      });
    })
    .catch(e => {
      res.status(400).send();
    });
});

router.post("/add", (req, res) => {
  var body = req.body;
  //var user = new User(body);
  ctruser
    .add(body)
    .then(user => {
      let token = user.generateAuthToken();
      return user; //updated with new token
    })
    .then(user => {
      res
        .header("x-auth", user.tokens[0].token)
        .send(_.omit(user, ["password", "tokens", "tk", "sk", "validation"]));
    })
    .catch(e => {
      console.log("Executer adduser err", e);
      res.status(400).send(e);
    });
});

router.post("/getme", authenticate, (req, res) => {
  res.send(_.omit(req.user, ["password", "tokens", "validation"]));
});

router.delete("/logout", authenticate, (req, res) => {
  //Logout. I do have the req.user throgh the authenticate middlware
  req.user
    .removeToken(req.token)
    .then(() => {
      res.status(200).send();
    })
    .catch(e => {
      console.log(e);
      res.status(400).send();
    });
});

router.get("/validate", async (req, res) => {
  try {
    var token = req.query.token;
    var validated = await User.findByValidation(token);
    if (!validated) {
      throw "Email validation error. Either invalid link or already validated!";
    }
    res.status(200).send("Validated user at aperium.io");
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

router.post("/resend", authenticate, async (req, res) => {
  try {
    var result = ctruser.createValidation(req.body.userid);
    res.status(200).send("OK");
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

router.post("/tradekeys", authenticate, async (req, res) => {
  try {
    var result = ctruser.updateKeys(req.body);
    res.status(200).send(_.omit(result, ["password", "tokens", "validation"]));
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

module.exports = router;

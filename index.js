require("dotenv").config();
const _ = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");

const Monitor = require("./controller/monitor.js");

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.get("/express", (req, res) => {
  res.send({ message: "Welcome to chart-trader Express Server" });
});

if (process.env.NODE_ENV === "production") {
  var sslRedirect = require("heroku-ssl-redirect");
  app.use(sslRedirect());
  // Express will serve up production assets
  // like our main.js file, or main.css file!
  app.use(express.static("client/build"));

  // Express will serve up the index.html file
  // if it doesn't recognize the route
  const path = require("path");
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

var monitor = new Monitor(3000);
app.post("/monitor", async (req, res) => {
  try {
    var result = await monitor.execute(req.body.indicator);
    res.send(result);
  } catch (e) {
    console.log("Error: ", e);
    res.status(400).send(e);
  }
});

app.listen(port, () => {
  console.log("Started on port " + port);
});

module.exports = { app };

// app.post("/testfunction", async (req, res) => {
//   try {
//     const result = await ctrlTest.test(
//       req.body.contractTitle,
//       req.body.testStr,
//       req.body.depositedEther
//     );
//     res.status(200).send(result);
//   } catch (e) {
//     console.log("Error: ", e);
//     res.status(400).send(e); //refer to httpstatuses.com
//   }
// });

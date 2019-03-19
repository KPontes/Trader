require("dotenv").config();
const wsport = 7500;

const axios = require("axios");
const bodyParser = require("body-parser");
const http = require("http");
const wsapp = require("express")();
wsapp.use(bodyParser.json());

// var cors = require("cors");
// const corsOptions = {
//   origin: "process.env.CLIENT_URL,
//   credentials: true
// };
// wsapp.use(cors(corsOptions));

//Settings for CORS
wsapp.use(function(req, res, next) {
  // Website you wish to allow to connect
  res.header("Access-Control-Allow-Origin", process.env.CLIENT_URL);
  // Request methods you wish to allow
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  // Request headers you wish to allow
  res.header("Access-Control-Allow-Headers", "X-Requested-With,content-type");
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);
  // Pass to next layer of middleware
  next();
});

const server = http.createServer(wsapp);
const io = require("socket.io")(server);
io.origins([process.env.CLIENT_URL]);
io.listen(wsport, {
  log: false,
  agent: false,
  transports: ["websocket", "htmlfile", "xhr-polling", "jsonp-polling", "polling"]
});

//wsapp.get("server").listen(wsport);
console.log("websocket server listening on port ", wsport);

// here you can start emitting events to the client
io.on("connection", client => {
  client.on("teste", () => console.log("recebida conexão teste"));
  client.on("subscribeToArbi", interval => {
    console.log("client subscribing to arbitrage with interval", interval);
    let arbiData;
    setInterval(async () => {
      arbiData = await getArbitrageData();
      client.emit("newarbitrage", arbiData);
    }, interval);
  });
});

function getArbitrageData() {
  return new Promise(async function(resolve, reject) {
    try {
      let _this = this;
      let url = `${process.env.LOADER_URL}/arbitrage`;
      axios
        .post(url)
        .then(function(response) {
          if ((response.status = 200)) {
            let candidates = response.data.filter(element => element.candidate === true);
            resolve(candidates);
          }
        })
        .catch(function(error) {
          console.log("Err getArbitrageData");
        });
    } catch (e) {
      console.log("getArbitrageData Error: ", e);
      reject(e);
    }
  });
}

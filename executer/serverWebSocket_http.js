require("dotenv").config();
const wsport = 7500;

const axios = require("axios");
const http = require("http");
const server = http.createServer(onRequest);
var io = require("socket.io")(server);

function onRequest(req, res) {
  res.writeHead(200, {
    "Access-Control-Allow-Origin": "trader.aperium.io:*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "X-Requested-With,content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  });
}

server.listen(wsport, function() {
  console.log("websocket server listening on port ", wsport);
});

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
          console.log("Err getArbitrageData", error);
        });
    } catch (e) {
      console.log("getArbitrageData Error: ", e);
      reject(e);
    }
  });
}

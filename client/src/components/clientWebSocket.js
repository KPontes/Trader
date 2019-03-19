import openSocket from "socket.io-client";

import sysconfig from "../config";

const socket = openSocket(sysconfig.EXECUTER_WS);

function subscribeToArbitrage(cb) {
  //socket.emit("teste");
  socket.on("newarbitrage", data => {
    cb(null, data);
    //console.log("data", data);
  });

  socket.emit("subscribeToArbi", 15000);
}
export { subscribeToArbitrage };

const dev = {
  PORT: 3000,
  EXECUTER_URI: "http://localhost:7000",
  EXECUTER_WS: "http://localhost:7500"
};

const prod = {
  PORT: 3000,
  EXECUTER_URI: "https://executer.aperium.io",
  EXECUTER_WS: "https://executerws.aperium.io"
};

// Default to dev if not set
const config = process.env.REACT_APP_STAGE === "prod" ? prod : dev;

const Symbols = ["BTCUSDT", "XRPUSDT", "ETHUSDT"]; //for performance report
const Algos = ["SMA", "EMA", "KLINES", "RSI", "BBANDS", "MACD"];
const SOCKETIO_PORT = 3100;

export default {
  // Add common config values here
  MAX_ATTACHMENT_SIZE: 5000000,
  Algos,
  Symbols,
  SOCKETIO_PORT,
  ...config
};

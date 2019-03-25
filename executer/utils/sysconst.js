const maxPrice = 999999999999;
const tradeFee = 0.001;
const algos = ["MA", "SMA", "EMA", "KLINES", "RSI", "MACD", "BBANDS"];
const defaultConfig = {
  calc_sma: [4, 7, 25, 99],
  calc_ema: [10, 25, 50],
  calc_rsi: [14],
  calc_bbands: [20],
  calc_macd: [12, 26, 9],
  calc_klines: [1],
  rule_sma: [3],
  rule_rsi: [30, 70, 7],
  rule_bbands: [100, 3],
  rule_macd: [],
  rule_klines: [0.005, 4, 8]
};

module.exports = {
  MAXPRICE: maxPrice,
  TRADEFEE: tradeFee,
  ALGOS: algos,
  DEFAULTCONFIG: defaultConfig
};

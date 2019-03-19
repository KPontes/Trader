const _ = require("lodash");

const exchange = require("./exchange");

("use strict");

const strategy = "Arbitrage";

const Markets = [
  { mkt1: "BTC", mkt2: "ETH" },
  { mkt1: "USDT", mkt2: "BTC" },
  { mkt1: "BTC", mkt2: "BNB" }
];

const execute = function() {
  return new Promise(async function(resolve, reject) {
    try {
      priceList = await exchange.symbolPrice("binance");
      let arbiList = [];
      let orderCandidates = [];
      for (let item of Markets) {
        let mkt2mkt1 = priceList.find(doc => doc.symbol === item.mkt2 + item.mkt1);
        //shortList only considering mkt1 and mkt2 symbols
        let shortList = priceList.filter(element => {
          let len = element.symbol.length;
          if (
            item.mkt1 === element.symbol.slice(len - item.mkt1.length) ||
            item.mkt2 === element.symbol.slice(len - item.mkt2.length)
          ) {
            if (element.symbol !== mkt2mkt1.symbol) {
              return element;
            }
          }
        });
        //list distinct tokens from shortlist
        let distinctTokens = shortList.map(element => {
          let len = element.symbol.length;
          if (item.mkt1 === element.symbol.slice(len - item.mkt1.length)) {
            return element.symbol.substr(0, len - item.mkt1.length);
          }
          if (item.mkt2 === element.symbol.slice(len - item.mkt2.length)) {
            return element.symbol.substr(0, len - item.mkt2.length);
          }
        });
        distinctTokens = _.uniq(distinctTokens);
        //console.log("distinctTokens", distinctTokens);
        let result = calculate(item.mkt1, item.mkt2, mkt2mkt1, shortList, distinctTokens);
        arbiList = arbiList.concat(result);
        //console.log("arbiList", arbiList);
        let orderBook = await exchange.bookTicker("binance");
        let candidates = evaluateOrderBook(arbiList, orderBook);
        orderCandidates = orderCandidates.concat(candidates);
        orderCandidates.sort(function(a, b) {
          return Math.abs(b.bookDiff) - Math.abs(a.bookDiff);
        });
        //console.log("orderCandidates", orderCandidates);
      }
      resolve(orderCandidates);
    } catch (err) {
      console.log(`Err ${strategy} execute`, err);
      reject(err);
    }
  });
};

const evaluateOrderBook = function(arbiList, orderBook) {
  try {
    let candidates = [];
    for (let item of arbiList) {
      let tokenMkt1 = orderBook.find(
        doc =>
          doc.symbol === item.tokenMkt1.symbol &&
          Number(doc.bidPrice) !== 0 &&
          Number(doc.askPrice) !== 0
      );
      let tokenMkt2 = orderBook.find(
        doc =>
          doc.symbol === item.tokenMkt2.symbol &&
          Number(doc.bidPrice) !== 0 &&
          Number(doc.askPrice) !== 0
      );
      let mkt2mkt1 = orderBook.find(
        doc =>
          doc.symbol === item.mkt2mkt1.symbol &&
          Number(doc.bidPrice) !== 0 &&
          Number(doc.askPrice) !== 0
      );
      if (tokenMkt1 && tokenMkt2 && mkt2mkt1) {
        let triangular = [];
        let newDiff;
        let resultp = positiveDiff(item, tokenMkt1, tokenMkt2, mkt2mkt1);
        let newDiffp = 1 / resultp[0].price * resultp[1].price * resultp[2].price - 1;
        let resultn = negativeDiff(item, tokenMkt1, tokenMkt2, mkt2mkt1);
        let newDiffn = 1 / resultn[0].price / resultn[1].price * resultn[2].price - 1;
        if (newDiffp > newDiffn) {
          newDiff = newDiffp;
          triangular = resultp;
        } else {
          newDiff = newDiffn;
          triangular = resultn;
        }

        console.log("+++++++++++++++++++++++++++++++++++++++++++++++");
        console.log("**newDiffp", newDiffp);
        console.log("**resultp", resultp);
        console.log("**newDiffn", newDiffn);
        console.log("**resultn", resultn);
        console.log("**newDiff", newDiff);
        console.log("**triangular", triangular);

        let oCandidate = _.pick(item, ["token", "mkt1", "mkt2"]);
        oCandidate.TKMK1 = tokenMkt1;
        oCandidate.TKMK2 = tokenMkt2;
        oCandidate.MK2KM1 = mkt2mkt1;
        oCandidate.triangular = triangular;
        oCandidate.bookDiff = newDiff;
        oCandidate.candidate = newDiff > 0 ? true : false;
        candidates.push(oCandidate);
      }
    }
    return candidates;
  } catch (err) {
    console.log(`Err ${strategy} evaluateOrderBook`, err);
    return err;
  }
};

const positiveDiff = function(item, tokenMkt1, tokenMkt2, mkt2mkt1) {
  //buy at best ask (seller) price and sell at best bid (buyer) price
  try {
    let maxQtyTkn = Math.min(
      tokenMkt1.askQty,
      tokenMkt1.bidQty,
      tokenMkt2.askQty,
      tokenMkt2.bidQty
    );
    let triangular = [
      {
        symbol: tokenMkt1.symbol,
        oper: "buy",
        price: tokenMkt1.askPrice,
        amount: maxQtyTkn,
        description: `buy ${item.token} with ${item.mkt1}`
      },
      {
        symbol: tokenMkt2.symbol,
        oper: "sell",
        price: tokenMkt2.bidPrice,
        amount: maxQtyTkn,
        description: `sell ${item.token} to ${item.mkt2}`
      },
      {
        symbol: mkt2mkt1.symbol,
        oper: "sell",
        price: mkt2mkt1.bidPrice,
        amount: maxQtyTkn * tokenMkt2.bidPrice,
        description: `sell ${item.mkt2} to ${item.mkt1}`
      }
    ];
    return triangular;
  } catch (err) {
    console.log(`Err ${strategy} positiveDiff`, err);
    return err;
  }
};

const negativeDiff = function(item, tokenMkt1, tokenMkt2, mkt2mkt1) {
  //buy at best ask (seller) price and sell at best bid (buyer) price
  try {
    let maxQtyTkn = Math.min(
      tokenMkt1.askQty,
      tokenMkt1.bidQty,
      tokenMkt2.askQty,
      tokenMkt2.bidQty
    );
    let triangular = [
      {
        symbol: mkt2mkt1.symbol,
        oper: "buy",
        price: mkt2mkt1.askPrice,
        amount: maxQtyTkn * tokenMkt2.askPrice,
        description: `buy ${item.mkt2} with ${item.mkt1}`
      },
      {
        symbol: tokenMkt2.symbol,
        oper: "buy",
        price: tokenMkt2.askPrice,
        amount: maxQtyTkn,
        description: `buy ${item.token} with ${item.mkt2}`
      },
      {
        symbol: tokenMkt1.symbol,
        oper: "sell",
        price: tokenMkt1.bidPrice,
        amount: maxQtyTkn,
        description: `sell ${item.token} to ${item.mkt1}`
      }
    ];
    return triangular;
  } catch (err) {
    console.log(`Err ${strategy} negativeDiff`, err);
    return err;
  }
};

const calculate = function(mkt1, mkt2, mkt2mkt1, shortList, tokens) {
  try {
    let arbiList = [];
    for (let token of tokens) {
      let tokenMkt1 = shortList.find(doc => doc.symbol === token + mkt1);
      let tokenMkt2 = shortList.find(doc => doc.symbol === token + mkt2);
      if (tokenMkt1 && tokenMkt2) {
        let tokenAmount = 1 / tokenMkt1.price;
        let mkt2Amount = tokenAmount * tokenMkt2.price;
        let mkt1Amount = mkt2Amount * mkt2mkt1.price;
        let diff = mkt1Amount - 1;
        //if (Math.abs(diff) > 0.003) {
        arbiList.push({
          tokenMkt1,
          tokenMkt2,
          mkt2mkt1,
          token,
          mkt1,
          mkt2,
          tokenAmount,
          mkt1Amount,
          mkt2Amount,
          diff
        });
        //}
      }
    }
    return arbiList;
  } catch (err) {
    console.log(`Err ${strategy} calculate`, err);
    return err;
  }
};

module.exports = {
  execute: execute,
  calculate: calculate
};

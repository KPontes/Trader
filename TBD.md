* (5) Executer monitor.js - Optimization would be iterate over pair in outer loop and user in inner loop, and try to reuse results instead of callinf API every time.
  R: Done optimization, TBD reuse API call - 19/02/19

* (5) Executer strategyOne.js - makeOrder - set new function to evaluate balance boundaries in USD and also BTC.
  R: Done for Percent and USD - 19/02/19

* (5) Executer strategyOne.js - updateStopLoss - instead of check direction Buy, better check if user has balance to decide whether or not update stopLoss price.

* (4) Colocar on/off do loader e executer no banco.

* (5) Restrict maps

* (4) TypeError [ERR_INVALID_CHAR]: Invalid character in header content ["X-MBX-APIKEY"]
  if X-MBX-APIKEY in Err => set user activeOff

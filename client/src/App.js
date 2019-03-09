import React, { Component } from "react";
import { BrowserRouter, Route } from "react-router-dom";

import Signup from "./components/signup";
import Home from "./containers/home";
import Signout from "./containers/signout";
import TradeReport from "./containers/tradereport";
import PerformanceReport from "./containers/performreport";
import Arbitrage from "./containers/arbitrage";

class App extends Component {
  render() {
    return (
      <div>
        <BrowserRouter>
          <div>
            <Route exact path="/" component={Home} />
            <Route exact path="/signout" component={Signout} />
            <Route exact path="/signup" component={Signup} />
            <Route exact path="/trades" component={TradeReport} />
            <Route exact path="/performance" component={PerformanceReport} />
            <Route exact path="/arbitrage" component={Arbitrage} />
          </div>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;

import React, { Component } from "react";
import { BrowserRouter, Route } from "react-router-dom";

import Plans from "./components/plans";
import Home from "./components/home";

class App extends Component {
  render() {
    return (
      <div>
        <BrowserRouter>
          <div>
            <Route exact path="/" component={Home} />
            <Route exact path="/plans" component={Plans} />
            <Route exact path="/trades" component={Plans} />
          </div>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;

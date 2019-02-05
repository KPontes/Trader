import React from "react";

import Account from "./account";
import Login from "./login";

const Home = logged => {
  logged = false;
  var display;

  if (logged) {
    display = <Account logged={logged} />;
  } else {
    display = <Login />;
  }
  return display;
};

export default Home;

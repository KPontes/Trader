import React from "react";
import { Link } from "react-router-dom";

import Account from "./account";

const logged = true;

const Home = logged => {
  var display;
  if (logged) {
    display = <Account logged={logged} />;
  }
  return display;
};

export default Home;

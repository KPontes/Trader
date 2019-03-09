import React from "react";
import { Link } from "react-router-dom";

const Menu = props => {
  var display;
  if (props.logged) {
    display = (
      <div className="text-right mb-3">
        <Link className="text-secondary mr-3" to="/">
          Account
        </Link>
        <Link className="text-secondary mr-3" to="/trades">
          Trades
        </Link>
        <Link className="text-secondary mr-3" to={"/performance"}>
          Performance
        </Link>
        <Link className="text-secondary mr-3" to={"/arbitrage"}>
          Arbitrage
        </Link>
        <Link className="text-secondary mr-3" to={"/signout"}>
          Sign-out
        </Link>
      </div>
    );
  } else {
    display = (
      <div className="text-right">
        <br />
        <Link className="text-secondary mr-3" to="/">
          Login
        </Link>
        <Link className="text-secondary mr-3" to={"/signup"}>
          Register
        </Link>
        <Link className="text-secondary mr-3" to={"/performance"}>
          Performance
        </Link>
      </div>
    );
  }
  return display;
};

export default Menu;

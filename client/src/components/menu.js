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
        <Link className="text-secondary mr-3" to="/plans">
          Performance Track
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
      </div>
    );
  }
  return display;
};

export default Menu;

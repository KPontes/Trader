import React from "react";
import { Link } from "react-router-dom";

const Menu = logged => {
  var display;
  if (logged) {
    display = (
      <div className="text-right">
        <br />
        <Link className="text-secondary mr-3" to="/home">
          Account
        </Link>
        <Link className="text-secondary mr-3" to="/plans">
          Plan configuration
        </Link>
        <Link className="text-secondary mr-3" to="/plans">
          Performance track
        </Link>
        <Link className="text-secondary mr-3" to="/plans">
          Sign-out
        </Link>
      </div>
    );
  } else {
    display = (
      <div className="text-right">
        <br />
        <Link className="text-secondary mr-3" to="/plans">
          Sign-up / Login
        </Link>
      </div>
    );
  }
  return display;
};

export default Menu;

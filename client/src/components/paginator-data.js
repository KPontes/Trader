import React, { Component } from "react";
import { render } from "react-dom";
var DataTable = require("react-data-components").DataTable;
require("react-data-components/css/table-twbs.css");

class Paginator extends Component {
  render() {
    let columns = this.props.columns;
    let data = this.props.data;
    console.log("**COLS", columns);
    console.log("**DATA", data);

    return (
      <div>
        <DataTable
          keys="date"
          columns={columns}
          initialData={data}
          initialPageLength={5}
          initialSortBy={{ prop: "date", order: "descending" }}
        />
      </div>
    );
  }
}

export default Paginator;

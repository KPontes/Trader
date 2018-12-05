const path = require("path");
const fs = require("fs-extra");

exports.getUsers = function() {
  return new Promise(async function(resolve, reject) {
    try {
      fs.readFile(process.env.BASEPATH + "/db/user.json", (err, data) => {
        if (err) throw err;
        let users = JSON.parse(data);
        resolve(users);
      });
    } catch (err) {
      console.log("getUsers: ", err);
      reject(err);
    }
  });
};

exports.setUsers = function(users) {
  return new Promise(async function(resolve, reject) {
    try {
      let data = JSON.stringify(users, null, 2);
      fs.writeFile(process.env.BASEPATH + "/db/user.json", data, err => {
        if (err) throw err;
        resolve("OK users");
      });
    } catch (err) {
      console.log("setUsers: ", err);
      reject(err);
    }
  });
};

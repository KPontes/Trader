var { User } = require("./../models/user.js");

var authenticate = (req, res, next) => {
  var token = req.header("x-auth");
  User.findByToken(token)
    .then(user => {
      if (!user) {
        return Promise.reject(); //triggers the catch
      }
      req.user = user;
      req.token = token;
      next(); //return from this middleware to the calling function
    })
    .catch(e => {
      //return error
      res.status(401).send();
    });
};

module.exports = { authenticate };

const scrypto = require("./simplecrypto.js");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports = {
  sendValidationMail: function sendValidationMail(user) {
    return new Promise(async function(resolve, reject) {
      try {
        const token = scrypto.createhash(user._id.toString());
        const msg = {
          to: user.email,
          from: "no-reply@aperium.io",
          subject: "Validation email",
          //text: "Click to validate",
          html: `<center><a href=${
            process.env.EXECUTER_URL
          }/user/validate?token=${token}>CLICK TO VALIDATE APERIUM TRADER USER</a></center>`
        };
        sgMail.send(msg);
        resolve(token);
      } catch (err) {
        console.log("Err sendValidationMail ");
        reject(err);
      }
    });
  }
};

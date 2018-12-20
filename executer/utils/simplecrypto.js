const crypto = require("crypto");

module.exports = {
  encrypt: function encrypt(str, password) {
    const algorithm = "aes-192-cbc";
    const key = crypto.scryptSync(password, process.env.SYSALT, 24);
    const iv = Buffer.alloc(16, 0); // Initialization vector.
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(str, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  },

  decrypt: function decrypt(encrypted, password) {
    const algorithm = "aes-192-cbc";
    const key = crypto.scryptSync(password, process.env.SYSALT, 24);
    const iv = Buffer.alloc(16, 0); // Initialization vector.
    const decipher = crypto.createDecipheriv(algorithm, key, iv);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  },
  createhash: function createhash(str) {
    const algorithm = "sha256";
    const hash = crypto.createHash(algorithm);
    hash.update(str);
    return hash.digest("hex");
  },
  comparehash: function comparehash(str, hashed) {
    const algorithm = "sha256";
    const hash = crypto.createHash(algorithm);
    hash.update(str);
    return hash.digest("hex") === hashed;
  }
};

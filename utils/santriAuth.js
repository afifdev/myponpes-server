const Santri = require("../models/Santri");
const { compare } = require("bcrypt");

const santriAuth = (req, res, next) => {
  try {
    Santri.findOne({ username: req.body.authUsername }).then((r) => {
      if (!r) {
        return next(new Error("Santri not found"));
      }
      compare(req.body.authPassword, r.password).then((match) => {
        if (!match) {
          return next(new Error("Password mismatch"));
        }
        return next();
      });
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = santriAuth;

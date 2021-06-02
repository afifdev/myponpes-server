const { compare } = require("bcrypt");
const Admin = require("../models/Admin");

const adminAuth = (req, res, next) => {
  try {
    Admin.findOne({ username: req.body.authUsername }).then((r) => {
      if (!r) {
        return next(new Error("Admin not found"));
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

module.exports = adminAuth;

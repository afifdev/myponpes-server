const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split("Bearer ")[1];
      if (token) {
        try {
          const user = jwt.verify(token, process.env.SECRET_KEY);
          req.body.authUsername = user.username;
          req.body.authPassword = user.password;
          return next();
        } catch (err) {
          return next(new Error("Invalid or expired token"));
        }
      }
      return next(new Error("Token should be bearer token"));
    }
    return next(new Error("Token must be provided"));
  } catch (err) {
    return next(err);
  }
};

module.exports = auth;

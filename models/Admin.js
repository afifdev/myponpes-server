const { Schema, model } = require("mongoose");

const Admin = new Schema({
  name: String,
  username: String,
  password: String,
  level: Number,
});

module.exports = model("Admin", Admin);

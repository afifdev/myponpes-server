const { Schema, model } = require("mongoose");

const Account = new Schema({
  balance: String,
  date: String,
});

module.exports = model("Account", Account);

const mongoose = require("mongoose");
const Int32 = require("mongoose-int32").loadType(mongoose);

const Account = new mongoose.Schema({
  balance: Int32,
  date: String,
});

module.exports = mongoose.model("Account", Account);

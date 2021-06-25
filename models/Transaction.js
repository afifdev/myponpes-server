const mongoose = require("mongoose");
const Int32 = require("mongoose-int32").loadType(mongoose);

const Transaction = new mongoose.Schema({
  title: String,
  is_debit: Boolean,
  date: String,
  amount: Int32,
});

module.exports = mongoose.model("Transaction", Transaction);

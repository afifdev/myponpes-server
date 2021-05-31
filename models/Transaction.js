const { Schema, model } = require("mongoose");

const Transaction = new Schema({
  is_debit: Boolean,
  date: String,
  amount: String,
  ref_code: String,
});

module.exports = model("Transaction", Transaction);

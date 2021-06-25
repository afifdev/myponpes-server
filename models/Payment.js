const mongoose = require("mongoose");
const Int32 = require("mongoose-int32").loadType(mongoose);

const Payment = new mongoose.Schema({
  title: String,
  amount: Int32,
  is_complete: Boolean,
  image: String,
  santri_id: String,
});

module.exports = mongoose.model("Payment", Payment);

const mongoose = require("mongoose");
const Int32 = require("mongoose-int32").loadType(mongoose);

const Payment = new mongoose.Schema({
  title: String,
  desc: String,
  amount: Int32,
  due_date: String,
  ref_code: String,
  is_spp: Boolean,
  is_complete: Boolean,
  santri: [
    {
      santri_id: String,
      payment_date: String,
      payment_image: String,
      is_complete: Boolean,
    },
  ],
});

module.exports = mongoose.model("Payment", Payment);

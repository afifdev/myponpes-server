const { Schema, model } = require("mongoose");

const Santri = new Schema({
  username: String,
  password: String,
  email: String,
  name: String,
  birth_date: String,
  birth_place: String,
  gender: Boolean,
  address: String,
  phone_number: String,
  parent_name: String,
  parent_phone_number: String,
  image: String,
  date_in: String,
  level: Number,
  progress: {
    hafalan: [
      {
        creator_id: String,
        date: String,
        juz: String,
        surat: String,
        ayat: String,
      },
    ],
    jamaah: [
      {
        creator_id: String,
        kind: String,
        date: String,
        is_attend: Boolean,
      },
    ],
    achievement: [
      {
        creator_id: String,
        title: String,
        event: String,
        image: String,
      },
    ],
    returning: [
      {
        creator_id: String,
        kind: String,
        date: String,
        return_due_date: String,
        return_date: String,
        is_return: Boolean,
      },
    ],
  },
});

module.exports = model("Santri", Santri);

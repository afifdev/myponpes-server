const { Schema, model } = require("mongoose");

const Event = new Schema({
  title: String,
  category: String,
  desc: String,
  date: String,
  santri_id: String,
  images: [],
});

module.exports = model("Event", Event);

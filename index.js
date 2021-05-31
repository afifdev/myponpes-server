const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
dotenv.config();

// config
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/images", express.static(path.join(__dirname, "images")));

// routes
app.use((err, req, res, next) => {
  res.json({
    message: "Error",
    data: "Please using API carefully",
  });
  next();
});

// server
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(4000, () => {
      console.log("Connection Success");
    });
  })
  .catch((err) => {
    console.log("Error occured");
    console.log(err);
  });

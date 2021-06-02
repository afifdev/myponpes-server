const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const { adminRoutes } = require("./routes");

// config
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/images", express.static(path.join(__dirname, "images")));

// routes
app.use("/api/admin", adminRoutes);
app.use((err, req, res, next) => {
  if (req.file) {
    fs.unlinkSync(path.join(__dirname, `./${req.file.path}`));
  }
  res.json({
    errors: err.message ? err.message : "Please using API carefully",
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

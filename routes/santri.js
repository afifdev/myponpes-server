const express = require("express");
const multer = require("multer");
const routes = express.Router();
const santriControllers = require("../controllers/santriControllers");
const { auth, santriAuth } = require("../utils");
const { fileFilter, paymentStorage } = require("../config/file");
const formHandler = multer().none();
const uploadHandler = multer({
  fileFilter: fileFilter,
  storage: paymentStorage,
}).single("image");

routes.post("/login", formHandler, santriControllers.login);

// Payment
routes.get("/payment", auth, santriAuth, santriControllers.getPayments);
routes.get("/payment/:id", auth, santriAuth, santriControllers.getPayment);
routes.put(
  "/payment/:id",
  uploadHandler,
  auth,
  santriAuth,
  santriControllers.updatePayment
);

module.exports = routes;

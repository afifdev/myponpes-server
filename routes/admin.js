const express = require("express");
const multer = require("multer");
const routes = express.Router();
const { auth, adminAuth } = require("../utils");
const adminControllers = require("../controllers/adminControllers");
const { fileFilter, santriStorage } = require("../config/file");
const formHandler = multer().none();
const uploadHandler = multer({
  fileFilter: fileFilter,
  storage: santriStorage,
}).single("image");

routes.post("/login", formHandler, adminControllers.login);

// User
routes.post(
  "/santri",
  uploadHandler,
  auth,
  adminAuth,
  adminControllers.createSantri
);
routes.get("/santri", auth, adminAuth, adminControllers.getSantris);
routes.get("/santri/:id", auth, adminAuth, adminControllers.getSantri);
routes.put(
  "/santri/:id",
  uploadHandler,
  auth,
  adminAuth,
  adminControllers.updateSantri
);
routes.delete("/santri/:id", auth, adminAuth, adminControllers.deleteSantri);

// Payment
routes.post(
  "/payment",
  formHandler,
  auth,
  adminAuth,
  adminControllers.createPayment
);

routes.get("/payment", auth, adminAuth, adminControllers.getPayments);
routes.get("/payment/:id", auth, adminAuth, adminControllers.getPayment);
routes.put(
  "/payment/:id/verify",
  formHandler,
  auth,
  adminAuth,
  adminControllers.verifyPayment
);
routes.put(
  "/payment/:id/reject",
  formHandler,
  auth,
  adminAuth,
  adminControllers.rejectPayment
);
routes.post(
  "/transaction",
  formHandler,
  auth,
  adminAuth,
  adminControllers.createTransaction
);

routes.get("/transaction", auth, adminAuth, adminControllers.getTransactions);
routes.get(
  "/transaction/:id",
  auth,
  adminAuth,
  adminControllers.getTransaction
);
routes.get("/balance", auth, adminAuth, adminControllers.getBalance);

module.exports = routes;

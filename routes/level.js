const express = require("express");
const multer = require("multer");
const routes = express.Router();
const levelControllers = require("../controllers/levelControllers");
const { auth, levelAuth } = require("../utils");
const { fileFilter, eventStorage } = require("../config/file");
const formHandler = multer().none();
const uploadHandler = multer({
  fileFilter: fileFilter,
  storage: eventStorage,
}).array("images");

const singleHandler = multer({
  fileFilter: fileFilter,
  storage: eventStorage,
}).single("image");

routes.post("/login", formHandler, levelControllers.login);
routes.get("/santri", auth, levelAuth, levelControllers.getSantris);
routes.get("/santri/:id", auth, levelAuth, levelControllers.getSantri);

routes.post(
  "/event",
  uploadHandler,
  auth,
  levelAuth,
  levelControllers.createEvent
);

routes.get("/event", auth, levelAuth, levelControllers.getEvents);
routes.get("/event/me", auth, levelAuth, levelControllers.getMyEvent);

routes.post(
  "/santri/:id/hafalan",
  formHandler,
  auth,
  levelAuth,
  levelControllers.insertHafalan
);
routes.post(
  "/santri/:id/jamaah",
  formHandler,
  auth,
  levelAuth,
  levelControllers.insertJamaah
);
routes.post(
  "/santri/:id/achievement",
  singleHandler,
  auth,
  levelAuth,
  levelControllers.insertAchievement
);
routes.post(
  "/santri/:id/returning",
  formHandler,
  auth,
  levelAuth,
  levelControllers.insertReturning
);
routes.get(
  "/santri/:id/returning",
  auth,
  levelAuth,
  levelControllers.checkReturning
);

routes.put(
  "/santri/:id/returning/:return_id",
  formHandler,
  auth,
  levelAuth,
  levelControllers.updateReturning
);

module.exports = routes;

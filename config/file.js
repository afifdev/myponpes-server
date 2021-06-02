const { diskStorage } = require("multer");
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const santriStorage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/santris");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + "-" + file.originalname);
  },
});
const eventStorage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/events");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + "-" + file.originalname);
  },
});
const paymentStorage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/payments");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + "-" + file.originalname);
  },
});
const achievementStorage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images/achievements");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + "-" + file.originalname);
  },
});

module.exports = {
  fileFilter,
  santriStorage,
  eventStorage,
  paymentStorage,
  achievementStorage,
};

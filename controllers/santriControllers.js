const jwt = require("jsonwebtoken");
const { compare } = require("bcrypt");
const Santri = require("../models/Santri");
const dotenv = require("dotenv");
const Event = require("../models/Event");
const Payment = require("../models/Payment");
const { isValidObjectId } = require("mongoose");
dotenv.config();

const login = async (req, res, next) => {
  try {
    if (!req.body.username || !req.body.password) {
      return next(new Error("Please fills out the fields"));
    }
    const santri = await Santri.findOne({ username: req.body.username });
    if (!santri) {
      return next(new Error("Santri not found"));
    }
    const isMatch = await compare(req.body.password, santri.password);
    if (!isMatch) {
      return next(new Error("Password mismatch"));
    }
    const token = await jwt.sign(
      {
        username: req.body.username,
        password: req.body.password,
        level: santri.level,
      },
      process.env.SECRET_KEY
    );
    return res.json({
      message: "success",
      data: {
        token,
        level: santri.level,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const getMySelf = async (req, res, next) => {
  const santri = await Santri.findOne(
    { username: req.body.authUsername },
    { progress: 0 }
  );
  return res.json({ message: "success", data: santri });
};

const getHafalan = async (req, res, next) => {
  try {
    const hafalan = await Santri.findOne(
      {
        username: req.body.authUsername,
      },
      { "progress.hafalan": 1 }
    );
    return res.json({ message: "success", data: hafalan });
  } catch (err) {
    return next(err);
  }
};

const getJamaah = async (req, res, next) => {
  try {
    const time = req.query.t;
    if (["subuh", "duhur", "asar", "maghrib", "isya"].includes(time)) {
      const jamaah = await Santri.findOne(
        {
          username: req.body.authUsername,
          "progress.jamaah": { $elemMatch: { kind: time } },
        },
        { "progress.jamaah": 1 }
      );
      return res.json({ message: "success", data: jamaah });
    }
    const jamaah = await Santri.findOne(
      {
        username: req.body.authUsername,
      },
      { "progress.jamaah": 1 }
    );
    return res.json({ message: "success", data: jamaah });
  } catch (err) {
    return next(err);
  }
};

const getAchievement = async (req, res, next) => {
  try {
    const achievement = await Santri.findOne(
      { username: req.body.authUsername },
      { "progress.achievement": 1 }
    );
    return res.json({ message: "success", data: achievement });
  } catch (err) {
    return next(err);
  }
};

const getEvents = async (req, res, next) => {
  try {
    const skipper = parseInt(req.query.currentPage) || 1;
    const limit = 8;
    const me = await Santri.findOne(
      { username: req.body.authUsername },
      { _id: 1 }
    );
    const count = await Event.find().countDocuments();
    const event = await Event.find()
      .sort({ _id: -1 })
      .skip((skipper - 1) * limit)
      .limit(limit);
    if (event.length < 1) {
      return next(new Error("Event not found"));
    }
    return res.json({
      message: "success",
      data: event,
      dataLength: count,
      prev: skipper > 1,
      next: count > skipper * limit,
    });
  } catch (err) {
    return next(err);
  }
};

const getReturning = async (req, res, next) => {
  try {
    const returning = await Santri.findOne(
      { username: req.body.authUsername },
      { "progress.returning": 1 }
    );
    return res.json({ message: "success", data: returning });
  } catch (err) {
    return next(err);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const santri = await Santri.findOne({ username: req.body.authUsername });
    const skipper = parseInt(req.query.currentPage) || 1;
    const limit = 10;
    const count = await Payment.countDocuments();
    const { title } = req.query;
    if (!title || title === "") {
      const payments = await Payment.find({ santri_id: santri._id })
        .skip((skipper - 1) * limit)
        .limit(limit);
      if (payments.length < 1) {
        return next(new Error("Payments not found"));
      }
      return res.json({
        message: "success",
        data: payments,
        dataLength: count,
        next: count > skipper * limit,
      });
    }

    const payments = await Payment.find({
      santri_id: santri._id,
      title: { $regex: new RegExp(title) },
    })
      .skip((skipper - 1) * limit)
      .limit(limit);
    if (payments.length < 1) {
      return next(new Error("Payments not found"));
    }
    return res.json({
      message: "success",
      data: payments,
      dataLength: count,
      next: count > skipper * limit,
    });
  } catch (err) {
    return next(err);
  }
};

const getPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return next(new Error("Invalid identifier"));
    }
    const santri = await Santri.findOne({ username: req.body.authUsername });
    const payment = await Payment.findOne({ _id: id, santri_id: santri._id });
    if (!payment || !santri) {
      return next(new Error("Payment not found"));
    }
    return res.json({
      message: "success",
      data: payment,
    });
  } catch (err) {
    return next(err);
  }
};

const updatePayment = async (req, res, next) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return next(new Error("Invalid identifier"));
  }
  if (!req.file) {
    return next(new Error("Image should inserted"));
  }
  const imagePath = req.file.path;
  const santri = await Santri.findOne({ username: req.body.authUsername });
  const payment = await Payment.findOneAndUpdate(
    { _id: id, santri_id: santri._id },
    {
      image: imagePath,
    },
    { useFindAndModify: false }
  );
  if (!payment) {
    return next(new Error("Cannot update you payment"));
  }
  return res.json({ message: "success" });
};

module.exports = {
  login,
  getMySelf,
  getHafalan,
  getEvents,
  getJamaah,
  getAchievement,
  getReturning,
  getPayments,
  getPayment,
  updatePayment,
};

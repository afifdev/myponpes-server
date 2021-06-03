const jwt = require("jsonwebtoken");
const { compare } = require("bcrypt");
const Santri = require("../models/Santri");
const dotenv = require("dotenv");
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

const getPayments = async (req, res, next) => {
  try {
    const santri = await Santri.findOne({ username: req.body.authUsername });
    const skipper = parseInt(req.query.currentPage) || 1;
    const limit = 10;
    const count = await Payment.countDocuments();
    const { title } = req.query;
    if (!title || title === "") {
      const payments = await Payment.find(
        { "santri.santri_id": santri._id },
        {
          title: 1,
          desc: 1,
          amount: 1,
          due_date: 1,
          ref_code: 1,
          is_spp: 1,
          santri: { $elemMatch: { santri_id: santri._id } },
        }
      )
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

    const payments = await Payment.find(
      {
        "santri.santri_id": santri._id,
        title: { $regex: new RegExp(title) },
      },
      {
        title: 1,
        desc: 1,
        amount: 1,
        due_date: 1,
        ref_code: 1,
        is_spp: 1,
        santri: { $elemMatch: { santri_id: santri._id } },
      }
    )
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
    const payment = await Payment.findOne(
      { _id: id, "santri.santri_id": santri._id },
      {
        title: 1,
        desc: 1,
        amount: 1,
        due_date: 1,
        ref_code: 1,
        is_spp: 1,
        santri: { $elemMatch: { santri_id: santri._id } },
      }
    );
    if (!payment) {
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
  const date = new Date().toISOString().split("T")[0];
  const santri = await Santri.findOne({ username: req.body.authUsername });
  const payment = await Payment.findOneAndUpdate(
    { _id: id, "santri.santri_id": santri._id },
    {
      $set: {
        "santri.$.payment_image": imagePath,
        "santri.$.payment_date": date,
      },
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
  getPayments,
  getPayment,
  updatePayment,
};

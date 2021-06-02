const { compare, hash } = require("bcrypt");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Payment = require("../models/Payment");
const Transaction = require("../models/Transaction");
const Account = require("../models/Account");
const Santri = require("../models/Santri");
const { isValidObjectId } = require("mongoose");
const ObjectId = require("mongoose").Types.ObjectId;
const Admin = require("../models/Admin");
dotenv.config();

const login = async (req, res, next) => {
  try {
    if (!req.body.username || !req.body.password) {
      return next(new Error("Please fill out the fields"));
    }
    const admin = await Admin.findOne({ username: req.body.username });
    if (!admin) {
      return next(new Error("Admin not found"));
    }
    const isMatch = await compare(req.body.password, admin.password);
    if (!isMatch) {
      return next(new Error("Password mismatch"));
    }
    const token = await jwt.sign(
      {
        username: req.body.username,
        password: req.body.password,
        level: admin.level,
      },
      process.env.SECRET_KEY
    );
    return res.json({
      message: "Success",
      data: {
        token,
        level: admin.level,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const createSantri = async (req, res, next) => {
  try {
    const body = req.body;
    if (
      !body.username ||
      !body.password ||
      !body.email ||
      !body.name ||
      !body.birth_date ||
      !body.birth_place ||
      !body.gender ||
      !body.address ||
      !body.phone_number ||
      !body.parent_name ||
      !body.parent_phone_number ||
      !body.level
    ) {
      return next(new Error("Please fill out the fields"));
    }
    const re =
      /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    const isUsernameEmailExist = await Santri.findOne({
      $or: [{ username: body.username }, { email: body.email }],
    });
    if (
      body.email !== body.email.toLowerCase() ||
      body.username !== body.username.toLowerCase() ||
      /\s/g.test(body.email) ||
      /\s/g.test(body.username) ||
      !re.test(String(req.body.email)) ||
      isUsernameEmailExist
    ) {
      return next(new Error("Fields Error"));
    }
    body.username = body.username.toLowerCase();
    const date = new Date();
    body.date_in = date.toISOString().split("T")[0];
    body.level = body.level ? 1 : 0;
    body.image = req.file.path;
    body.gender = req.body.gender === "1";
    body.password = await hash(body.password, 12);

    const santri = new Santri({
      ...body,
    });
    const saveSantri = await santri.save();
    return res.json({
      message: "success",
    });
  } catch (err) {
    return next(err);
  }
};

const updateSantri = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    if (!isValidObjectId(id)) {
      return next(new Error("Invalid identifier"));
    }
    if (
      body._id ||
      body.username ||
      body.email ||
      body.progress ||
      body.payment
    ) {
      return next(new Error("Unallowed fields"));
    }
    if (req.file) {
      body.image = req.file.path;
    }
    const updatedSantri = await Santri.findOneAndUpdate(
      { _id: id },
      { ...body },
      { useFindAndModify: false }
    );
    if (!updatedSantri) {
      return next(new Error("Cannot update"));
    }
    fs.unlinkSync(path.join(__dirname, `../${updatedSantri.image}`));
    return res.json({
      message: "success",
    });
  } catch (err) {
    return next(err);
  }
};

const getSantris = async (req, res, next) => {
  try {
    const skipper = parseInt(req.query.currentPage) || 1;
    const limit = 10;
    const count = await Santri.countDocuments();
    const { username } = req.query;

    if (!username || username === "") {
      const santris = await Santri.find()
        .skip((skipper - 1) * limit)
        .limit(limit);
      if (santris.length < 1) {
        return next(new Error("Santri not found"));
      }
      return res.json({
        message: "success",
        data: santris,
        dataLength: count,
        next: count > skipper * limit,
      });
    }

    const santris = await Santri.find(
      { username: { $regex: new RegExp(username) } },
      { progress: 0, password: 0 }
    )
      .skip((skipper - 1) * limit)
      .limit(limit);

    if (santris.length < 1) {
      return next(new Error("Santri not found"));
    }

    return res.json({
      message: "success",
      data: santris,
      dataLength: count,
      next: count > skipper * limit,
    });
  } catch (err) {
    return next(err);
  }
};

const getSantri = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!isValidObjectId(id)) {
      return next(new Error("Invalid identifier"));
    }
    const santri = await Santri.findOne(
      { _id: id },
      { progress: 0, password: 0 }
    );
    if (!santri) {
      return next(new Error("No santri found"));
    }
    return res.json({
      message: "success",
      data: santri,
    });
  } catch (err) {
    return next(err);
  }
};

const deleteSantri = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    if (!isValidObjectId(id)) {
      return next(new Error("Invalid identifier"));
    }
    const deletedSantri = await Santri.findOneAndDelete({ _id: id });
    if (!deletedSantri) {
      return next(new Error("Santri not found"));
    }
    fs.unlinkSync(path.join(__dirname, `../${deletedSantri.image}`));
    return res.json({
      message: "success",
    });
  } catch (err) {
    return next(err);
  }
};

const createPayment = async (req, res, next) => {
  // use json
  try {
    const body = req.body;
    if (
      !body.title ||
      !body.desc ||
      !body.amount ||
      !body.due_date ||
      !body.ref_code ||
      !body.is_spp ||
      !body.group ||
      (body.group === "specified" && !body.santri)
    ) {
      return next(new Error("Please fills out the fields"));
    }
    if (body.group === "all") {
      const getAllSantri = await Santri.find({}, { _id: 1 });
      body.santri = [];
      getAllSantri.map((santri) => {
        body.santri.push({ santri_id: santri._id });
      });
    } else {
      const checkSantri = await Santri.find({ _id: { $in: body.santri } });
      if (checkSantri.length !== body.santri.length) {
        return next(new Error("Some santri not found"));
      }
    }
    body.is_spp = body.is_spp === "1";
    body.amount = parseInt(body.amount);
    const payment = new Payment({
      ...body,
    });
    const savedPayment = await payment.save();
    if (!savedPayment) {
      return next(new Error("Cannot proceed"));
    }
    return res.json({ message: "success" });
  } catch (err) {
    return next(err);
  }
};

const getPayments = async (req, res, next) => {
  try {
    const skipper = parseInt(req.query.currentPage) || 1;
    const limit = 10;
    const count = await Payment.countDocuments();
    const { title } = req.query;

    if (!title || title === "") {
      const payments = await Payment.find({}, { santri: 0 })
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
        title: { $regex: new RegExp(title) },
      },
      { santri: 0 }
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
    const payment = await Payment.aggregate([
      {
        $match: { _id: ObjectId(id) },
      },
      { $unwind: "$santri" },
      {
        $lookup: {
          from: "santris",
          let: {
            santri_id: { $toObjectId: "$santri.santri_id" },
            santri: "$santri",
          },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$santri_id"] } } },
            {
              $replaceRoot: {
                newRoot: { $mergeObjects: ["$$santri", "$$ROOT"] },
              },
            },
          ],
          as: "santri",
        },
      },
      {
        $group: {
          _id: "$_id",
          title: { $first: "$title" },
          desc: { $first: "$desc" },
          amount: { $first: "$amount" },
          due_date: { $first: "$due_date" },
          ref_code: { $first: "$ref_code" },
          is_spp: { $first: "$is_spp" },
          is_complete: { $first: "$is_complete" },
          santri: { $push: { $first: "$santri" } },
        },
      },
      {
        $project: {
          "santri.progress": 0,
          "santri.password": 0,
        },
      },
    ]);
    if (!payment) {
      return next(new Error("No payment found"));
    }
    return res.json({
      message: "success",
      data: payment,
    });
  } catch (err) {
    return next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body;
    if (!body.santri) {
      return next(new Error("Which santri need to vefiry?"));
    }
    if (!isValidObjectId(id) || !isValidObjectId(body.santri)) {
      return next(new Error("Invalid identifier"));
    }
    const santri = await Santri.find({ _id: body.santri }, { _id: 1 });
    if (!santri) {
      return next(new Error("No santri found"));
    }
    const payment = await Payment.findOneAndUpdate(
      { _id: id, "santris.santri_id": body.santri },
      {
        $set: {
          "santris.$.is_complete": true,
        },
      },
      { useFindAndModify: false }
    );
    if (!payment) {
      return next(new Error("Failed updating payment"));
    }
    const checkComplete = payment.santri.map((s) => {
      if (!s.is_complete) {
        return false;
      }
    });
    if (checkComplete === true) {
      payment.is_complete = true;
      const savePayment = await payment.save();
      if (!savePayment) {
        return next(new Error("Error occured on saving payment"));
      }
    }
    return res.json({
      message: "success",
      data: payment,
    });
  } catch (err) {
    return next(err);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const body = req.body;
    if (!body.title || !body.is_debit || !body.amount) {
      return next(new Error("Please fills out the fields"));
    }
    body.amount = parseInt(body.amount);
    const account = await Account.find().sort({ _id: 1 }).limit(1);
    if (body.is_debit !== "1" && account) {
      if (!(account.balance > body.amount)) {
        return next(new Error("You will in debt"));
      }
    }
    const transaction = new Transaction({
      title: body.title,
      is_debit: body.is_debit === "1",
      date: new Date().toString().split("T")[0],
      amount: body.amount,
    });
    const saveTransaction = await transaction.save();
    if (!saveTransaction) {
      return next(new Error("Cannot save transaction"));
    }
    if (account && account.date === new Date().toString().split("T")[0]) {
      const updater = {
        balance:
          body.is_debit === "1"
            ? account.balance + body.amount
            : account.balance - body.amount,
      };
      const updatedAccount = await Account.findOneAndUpdate(
        { _id: account._id },
        updater,
        { useFindAndModify: false }
      );
      if (!updatedAccount) {
        const deleteTransaction = await saveTransaction.delete();
        return next(new Error("Cannot save to account"));
      }
      return res.json({ message: "success" });
    } else {
      const updater = {
        balance: account
          ? body.is_debit
            ? account.balance + body.amount
            : account.balance - body.amount
          : body.amount,
      };
      const newAccount = new Account({
        ...updater,
        date: new Date().toString().split("T")[0],
      });
      const saveNewAccount = await newAccount.save();
      if (!saveNewAccount) {
        const deleteTransaction = await saveTransaction.delete();
        return next(new Error("Cannot save to account"));
      }
    }
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  login,
  createSantri,
  getSantris,
  getSantri,
  updateSantri,
  deleteSantri,
  createPayment,
  getPayments,
  getPayment,
  verifyPayment,
  createTransaction,
};
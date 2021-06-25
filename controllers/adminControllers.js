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
const toISOLocal = require("../utils/toISOLocal");
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
      !req.file ||
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
      !body.parent_phone_number
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
    const date = new Date();
    body.date_in = toISOLocal(date);
    body.level = body.level ? 1 : 0;
    body.image = req.file.path;
    body.gender = req.body.gender === "1";
    body.password = await hash(body.password, 12);

    const santri = new Santri({
      ...body,
    });
    const saveSantri = await santri.save();
    if (!saveSantri) {
      return next(new Error("Couldn't save santri"));
    }
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
    const limit = 15;
    const { username } = req.query;

    if (!username || username === "") {
      const count = await Santri.countDocuments();
      const santris = await Santri.find({}, { progress: 0, password: 0 })
        .sort({ _id: -1 })
        .skip((skipper - 1) * limit)
        .limit(limit);
      if (santris.length < 1) {
        return next(new Error("Santri not found"));
      }
      return res.json({
        message: "success",
        data: santris,
        dataLength: count,
        prev: skipper > 1,
        next: count > skipper * limit,
      });
    }
    const count = await Santri.find(
      { username: { $regex: new RegExp(username) } },
      { progress: 0, password: 0 }
    ).countDocuments();
    const santris = await Santri.find(
      { username: { $regex: new RegExp(username) } },
      { progress: 0, password: 0 }
    )
      .sort({ _id: -1 })
      .skip((skipper - 1) * limit)
      .limit(limit);

    if (santris.length < 1) {
      return next(new Error("Santri not found"));
    }

    return res.json({
      message: "success",
      data: santris,
      dataLength: count,
      prev: skipper > 1,
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
      body.payment ||
      body.date_in ||
      body.level
    ) {
      return next(new Error("Disallowed fields"));
    }
    if (body.password) {
      body.password = await hash(body.password, 12);
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
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, `../${updatedSantri.image}`));
    }
    return res.json({
      message: "success",
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
  try {
    const body = req.body;
    if (!body.title || !body.amount || !body.santri_id) {
      return next(new Error("Please fills out the fields"));
    }
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
    const limit = 15;
    const count = await Payment.countDocuments();
    const { title } = req.query;

    if (!title || title === "") {
      const payments = await Payment.find({}, { santri: 0 })
        .sort({ _id: -1 })
        .skip((skipper - 1) * limit)
        .limit(limit);
      if (payments.length < 1) {
        return next(new Error("Payments not found"));
      }
      return res.json({
        message: "success",
        data: payments,
        dataLength: count,
        prev: skipper > 1,
        next: count > skipper * limit,
      });
    }

    const payments = await Payment.find(
      {
        title: { $regex: new RegExp(title) },
      },
      { santri: 0 }
    )
      .sort({ _id: -1 })
      .skip((skipper - 1) * limit)
      .limit(limit);
    if (payments.length < 1) {
      return next(new Error("Payments not found"));
    }
    return res.json({
      message: "success",
      data: payments,
      dataLength: count,
      prev: skipper > 1,
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
    const payment = await Payment.findOne({ _id: id });
    const santri = await Santri.findOne(
      { _id: payment.santri_id },
      { _id: 1, name: 1, image: 1 }
    );
    if (!payment || !santri) {
      return next(new Error("No payment found"));
    }
    return res.json({
      message: "success",
      data: {
        ...payment._doc,
        santri_name: santri.name,
        santri_image: santri.image,
      },
    });
  } catch (err) {
    return next(err);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findOneAndUpdate(
      { _id: id },
      {
        is_complete: true,
      },
      { useFindAndModify: false }
    );
    if (!payment) {
      return next(new Error("Failed updating payment"));
    }

    const newTrans = new Transaction({
      title: payment.title,
      is_debit: true,
      date: toISOLocal(new Date()),
      amount: payment.amount,
    });

    const saveNewTrans = await newTrans.save();
    if (!saveNewTrans) {
      return next(new Error("Error in saving to transaction"));
    }

    const prevAccount = await Account.find().sort({ _id: -1 }).limit(1);
    if (
      prevAccount[0] &&
      prevAccount[0].date.split("T")[0] === toISOLocal(new Date()).split("T")[0]
    ) {
      const updateAccount = await Account.findOneAndUpdate(
        { _id: prevAccount[0]._id },
        { $inc: { balance: payment.amount } },
        { useFindAndModify: false }
      );
      if (!updateAccount) {
        return next(new Error("Error in updating balance"));
      }
    } else {
      const newAccount = new Account({
        balance: prevAccount[0]
          ? prevAccount[0].balance + payment.amount
          : payment.amount,
        date: toISOLocal(new Date()),
      });
      const saveNewAccount = await newAccount.save();
      if (!saveNewAccount) {
        return next(new Error("Error in updating balance"));
      }
    }
    return res.json({
      message: "success",
    });
  } catch (err) {
    return next(err);
  }
};

const rejectPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const findImage = await Payment.findOne({ _id: id });
    const payment = await Payment.findOneAndUpdate(
      { _id: id },
      {
        is_complete: false,
        image: null,
      },
      { useFindAndModify: false }
    );
    if (!payment) {
      return next(new Error("Failed updating payment"));
    }
    fs.unlinkSync(path.join(__dirname, `../${findImage.image}`));
    return res.json({ message: payment });
  } catch (err) {
    return next(err);
  }
};

const createTransaction = async (req, res, next) => {
  try {
    const body = req.body;
    if (!body.title || !body.amount || ![1, 0].includes(body.is_debit)) {
      return next(new Error("Please fills out the fields"));
    }
    body.amount = parseInt(body.amount);
    const account = await Account.find().sort({ _id: -1 }).limit(1);
    if (body.is_debit !== 1) {
      if (
        account.length < 1 ||
        (account[0] && !(account[0].balance > body.amount))
      ) {
        return next(new Error("You will in debt"));
      }
    }
    const transaction = new Transaction({
      title: body.title,
      is_debit: body.is_debit === 1,
      date: toISOLocal(new Date()),
      amount: body.amount,
    });
    const saveTransaction = await transaction.save();
    if (!saveTransaction) {
      return next(new Error("Cannot save transaction"));
    }
    if (
      account[0] &&
      account[0].date.split("T")[0] === toISOLocal(new Date()).split("T")[0]
    ) {
      const updater = {
        balance:
          body.is_debit === 1
            ? account[0].balance + body.amount
            : account[0].balance - body.amount,
      };
      const updatedAccount = await Account.findOneAndUpdate(
        { _id: account[0]._id },
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
        balance: account[0]
          ? body.is_debit
            ? account[0].balance + body.amount
            : account[0].balance - body.amount
          : body.amount,
      };
      const newAccount = new Account({
        ...updater,
        date: toISOLocal(new Date()),
      });
      const saveNewAccount = await newAccount.save();
      if (!saveNewAccount) {
        const deleteTransaction = await saveTransaction.delete();
        return next(new Error("Cannot save to account"));
      }
      return res.json({ message: "success" });
    }
  } catch (err) {
    return next(err);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const skipper = parseInt(req.query.currentPage) || 1;
    const limit = 15;
    const { title } = req.query;

    if (!title || title === "") {
      const count = await Transaction.countDocuments();
      const transactions = await Transaction.find()
        .sort({ _id: -1 })
        .skip((skipper - 1) * limit)
        .limit(limit);
      if (transactions.length < 1) {
        return next(new Error("Transactions not found"));
      }
      return res.json({
        message: "success",
        data: transactions,
        dataLength: count,
        prev: skipper > 1,
        next: count > skipper * limit,
      });
    }

    const count = await Transaction.find({
      title: { $regex: new RegExp(title) },
    }).countDocuments();
    const transactions = await Transaction.find({
      title: { $regex: new RegExp(title) },
    })
      .sort({ _id: -1 })
      .skip((skipper - 1) * limit)
      .limit(limit);
    if (transactions.length < 1) {
      return next(new Error("Transactions not found"));
    }
    return res.json({
      message: "success",
      data: transactions,
      dataLength: count,
      prev: skipper > 1,
      next: count > skipper * limit,
    });
  } catch (err) {
    return next(err);
  }
};

const getTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return next(new Error("Invalid identifier"));
    }
    const transaction = await Transaction.findOne({ _id: id });
    if (!transaction) {
      return next(new Error("No transaction found"));
    }
    return res.json({
      message: "success",
      data: transaction,
    });
  } catch (err) {
    return next(err);
  }
};

const getBalance = async (req, res, next) => {
  try {
    if (req.query.last) {
      const account = await Account.find().sort({ _id: -1 }).limit(1);
      if (account[0] && account.length > 0) {
        return res.json({
          message: "success",
          data: account[0],
        });
      }
    } else {
      const accounts = await Account.find().limit(15);
      if (accounts.length > 0) {
        return res.json({
          message: "success",
          data: accounts,
        });
      }
    }
    return next(new Error("Account still empty"));
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
  rejectPayment,
  createTransaction,
  getTransactions,
  getTransaction,
  getBalance,
};

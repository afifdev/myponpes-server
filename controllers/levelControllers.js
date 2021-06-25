const { compare } = require("bcrypt");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const Santri = require("../models/Santri");
const Event = require("../models/Event");
const { isValidObjectId } = require("mongoose");
const ObjectId = require("mongoose").Types.ObjectId;
const toISOLocal = require("../utils/toISOLocal");
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
    if (santri.level === 0) {
      return next(new Error("Unauthorized"));
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

const getSantris = async (req, res, next) => {
  try {
    const skipper = parseInt(req.query.currentPage) || 1;
    const limit = 15;
    const count = await Santri.find({ level: 0 }).countDocuments();
    const { username } = req.query;

    if (!username || username === "") {
      const santris = await Santri.find(
        { level: 0 },
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
    }

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
      { _id: id, level: 0 },
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

const createEvent = async (req, res, next) => {
  try {
    const creator = await Santri.findOne(
      { username: req.body.authUsername },
      { _id: 1 }
    );
    if (!req.files) {
      return next(new Error("image should be uploaded"));
    }
    const data = req.body;
    if (!data.title || !data.category || !data.desc) {
      return next(new Error("Please fills out the fields"));
    }
    data.images = [];
    req.files.map((image) => {
      data.images.push(image.path);
    });
    const event = new Event({
      ...data,
      date: toISOLocal(new Date()),
      creator_id: creator._id,
    });
    const savedEvent = await event.save();
    return res.json({ message: "success" });
  } catch (err) {
    return next(err);
  }
};

const getMyEvent = async (req, res, next) => {
  try {
    const skipper = parseInt(req.query.currentPage) || 1;
    const limit = 8;
    const me = await Santri.findOne(
      { username: req.body.authUsername },
      { _id: 1 }
    );
    const count = await Event.find({ creator_id: me._id }).countDocuments();
    const event = await Event.find({ creator_id: me._id })
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

const insertHafalan = async (req, res, next) => {
  try {
    const creator = await Santri.findOne(
      { username: req.body.authUsername },
      { _id: 1 }
    );
    const id = req.params.id;
    const data = req.body;
    if (!data.juz || !data.surat || !data.ayat) {
      return next(new Error("Please fills out the field"));
    }
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

    const updateSantri = await Santri.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          "progress.hafalan": {
            creator_id: creator._id,
            date: toISOLocal(new Date()),
            juz: data.juz,
            surat: data.surat,
            ayat: data.ayat,
          },
        },
      },
      { useFindAndModify: false }
    );
    return res.json({ message: "success" });
  } catch (err) {
    return next(err);
  }
};

const insertJamaah = async (req, res, next) => {
  try {
    const creator = await Santri.findOne(
      { username: req.body.authUsername },
      { _id: 1 }
    );
    const id = req.params.id;
    const data = req.body;
    if (
      !["subuh", "duhur", "asar", "maghrib", "isya"].includes(data.kind) ||
      !data.is_attend
    ) {
      return next(new Error("Please fills out the field"));
    }
    if (!isValidObjectId(id)) {
      return next(new Error("Invalid identifier"));
    }
    const santri = await Santri.findOne({ _id: id }, { password: 0 });
    if (!santri) {
      return next(new Error("No santri found"));
    }

    const updateSantri = await Santri.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          "progress.jamaah": {
            creator_id: creator._id,
            kind: data.kind,
            date: toISOLocal(new Date()),
            is_attend: data.is_attend === 1 || data.is_attend === "1",
          },
        },
      },
      { useFindAndModify: false }
    );
    return res.json({ message: "success" });
  } catch (err) {
    return next(err);
  }
};

const insertAchievement = async (req, res, next) => {
  try {
    const creator = await Santri.findOne(
      { username: req.body.authUsername },
      { _id: 1 }
    );
    const id = req.params.id;
    const data = req.body;
    if (!data.title || !data.event || !req.file) {
      return next(new Error("Please fills out the field"));
    }
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

    const updateSantri = await Santri.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          "progress.achievement": {
            creator_id: creator._id,
            title: data.title,
            event: data.event,
            image: req.file.path,
          },
        },
      },
      { useFindAndModify: false }
    );
    return res.json({ message: "success" });
  } catch (err) {
    return next(err);
  }
};

const insertReturning = async (req, res, next) => {
  try {
    const creator = await Santri.findOne(
      { username: req.body.authUsername },
      { _id: 1 }
    );
    const id = req.params.id;
    const data = req.body;
    if (!data.kind || !data.return_due_date) {
      return next(new Error("Please fills out the field"));
    }
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

    const updateSantri = await Santri.findOneAndUpdate(
      { _id: id },
      {
        $push: {
          "progress.returning": {
            creator_id: creator._id,
            kind: data.kind,
            return_due_date: data.return_due_date,
            is_return: false,
          },
        },
      },
      { useFindAndModify: false }
    );
    return res.json({ message: "success" });
  } catch (err) {
    return next(err);
  }
};

const checkReturning = async (req, res, next) => {
  try {
    const returning = await Santri.findOne(
      { _id: req.params.id, level: 0 },
      { "progress.returning": 1 }
    );
    const check =
      returning.progress.returning[returning.progress.returning.length - 1];
    if (check.is_return) {
      return res.json({ status: "OK" });
    }
    return res.json({ status: "KO", data: check });
  } catch (err) {
    return next(err);
  }
};

const updateReturning = async (req, res, next) => {
  try {
    const { id, return_id } = req.params;
    const updateSantri = await Santri.findOneAndUpdate(
      { _id: id, "progress.returning._id": return_id },
      {
        $set: {
          "progress.returning.$.return_date": toISOLocal(new Date()),
          "progress.returning.$.is_return": true,
        },
      },
      { useFindAndModify: false }
    );
    return res.json({ message: "success" });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  login,
  getSantris,
  getSantri,
  createEvent,
  getMyEvent,
  getEvents,
  insertHafalan,
  insertJamaah,
  insertAchievement,
  insertReturning,
  checkReturning,
  updateReturning,
};

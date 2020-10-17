require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const cors = require("cors");

mongoose.connect(
  `mongodb+srv://admin:${process.env.ATLAS_KEY}@one-deed-a-day.iudkb.mongodb.net/one-deed-a-day?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  }
);

const userSchema = mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  userUrl: String,
});
const User = mongoose.model("user", userSchema);

const deedSchema = mongoose.Schema({
  title: {
    type: String,
    unique: true,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  completedUsers: Array,
  url: { type: String, unique: true },
});
const Deed = mongoose.model("deed", deedSchema);

const app = express();
app.use(express.json());
app.use(cors());

// deeds REST
app
  .route("/deeds")
  .post(function (req, res) {
    const newDeed = {
      title: req.body.title,
      description: req.body.description,
      author: req.body.author,
      completedUsers: [],
      url: `/${req.body.author}/${_.kebabCase(req.body.title)}`,
    };
    Deed.create(newDeed, function (err, doc) {
      err ? res.status(400).send("invalid deed") : res.status(200).send(doc);
    });
  })
  .get(function (req, res) {
    Deed.find({}, function (err, deeds) {
      !err && deeds
        ? res.status(200).send(deeds)
        : res.status(400).send("invalid deed");
    });
  });

app
  .route("/:user/:deed")
  .post(function (req, res) {
    Deed.findOne({ url: req.url }, function (err, deed) {
      if (!err && deed) {
        deed.completedUsers.push(req.body.user);
        deed.save();
      }
    });
  })
  .get(function (req, res) {
    console.log(req.url);
    Deed.findOne({ url: req.url }, function (err, deed) {
      !err && deed
        ? res.status(200).send(deed)
        : res.status(400).send("invalid deed", err, deed);
    });
  });

//login path
app
  .route("/users")
  .get(function (req, res) {
    User.findOne({ username: req.body.username }, function (error, user) {
      if (!error && user) {
        bcrypt.compare(req.body.password, user.password, function (
          error,
          same
        ) {
          error || !same
            ? res.status(400).send("wrong password")
            : res.status(200).send("success");
        });
      } else {
        res.status(404).send("user cannot be found");
      }
    });
  })
  .post(function (req, res) {
    bcrypt.hash(req.body.password, 10, function (hashErr, hash) {
      const newUser = {
        username: req.body.username,
        email: req.body.email,
        password: hash,
      };
      User.create(newUser, function (dbError, newUser) {
        !dbError && newUser
          ? res.status(200).send(newUser)
          : res.status(500).send(dbError);
      });
    });
  });

app.listen(process.env.PORT || 2000);

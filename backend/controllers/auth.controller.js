const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const { body, validationResult } = require('express-validator');
const BlacklistedToken = require('../models/BlacklistedToken');

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { password, username, email } = req.body;

  // Save User to Database
  User.create({
    username: username,
    email: email,
    password: bcrypt.hashSync(password, 8)
  })
    .then(user => {
      res.send({ message: "User was registered successfully!" });
    })
    .catch(err => {
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).send({ message: "Failed! Email is already in use!" });
      }
      res.status(500).send({ message: err.message });
    });
};

exports.signin = (req, res) => {
  User.findOne({
    where: {
      username: req.body.username
    },
    attributes: { exclude: ['password'] }
  })
    .then(user => {
      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({
          accessToken: null,
          message: "Invalid Password!"
        });
      }

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: '1h'
      });

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
      };

      res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 3600 * 1000
      });

      res.status(200).send(userResponse);
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

exports.logout = async (req, res) => {
  const token = req.cookies.accessToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, config.secret);
      await BlacklistedToken.create({ token, expiryDate: new Date(decoded.exp * 1000) });
    } catch (err) {
      // Ignore errors if token is invalid
    }
  }
  res.clearCookie("accessToken");
  res.status(200).send({ message: "Logout successful." });
};

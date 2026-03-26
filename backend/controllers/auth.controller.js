const asyncHandler = require("express-async-handler");
const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const { body, validationResult } = require('express-validator');
const BlacklistedToken = require('../models/BlacklistedToken');

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = [
  // Validate and sanitize fields.
  body('username', 'Username must be at least 3 chars long').isLength({ min: 3 }).trim().escape(),
  body('email', 'Please include a valid email').isEmail().normalizeEmail(),
  body('password', 'Password must be at least 8 characters long and contain at least one number, one uppercase and one lowercase letter')
    .isLength({ min: 8 })
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/, "i"),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password, username, email } = req.body;

    // Save User to Database
    const user = await User.create({
      username: username,
      email: email,
      password: bcrypt.hashSync(password, 8)
    });
    
    res.send({ message: "User was registered successfully!" });
  })
];

exports.signin = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    where: {
      username: req.body.username
    }
  });

  if (user && (await bcrypt.compare(req.body.password, user.password))) {
    const token = jwt.sign({ id: user.id }, config.secret, {
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
  } else {
    res.status(401);
    throw new Error("Invalid credentials");
  }
});

exports.logout = asyncHandler(async (req, res) => {
  const token = req.cookies.accessToken;
  if (token) {
    const decoded = jwt.verify(token, config.secret);
    await BlacklistedToken.create({ token, expiryDate: new Date(decoded.exp * 1000) });
  }
  res.clearCookie("accessToken");
  res.status(200).send({ message: "Logout successful." });
});

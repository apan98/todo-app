const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const db = require("../models");
const User = db.user;
const BlacklistedToken = require('../models/BlacklistedToken');

verifyToken = async (req, res, next) => {
  let token = req.cookies.accessToken;

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  const blacklisted = await BlacklistedToken.findOne({ where: { token } });
  if (blacklisted) {
    return res.status(401).send({ message: "Unauthorized! Token is blacklisted." });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!"
      });
    }
    req.userId = decoded.id;
    next();
  });
};

const authJwt = {
  verifyToken: verifyToken,
};
module.exports = authJwt;

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { tokenBlocklist } = require("../controllers/authController");

module.exports = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  if (tokenBlocklist.has(token)) {
    return res.status(401).json({ error: "Token is blocklisted" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findByPk(decoded.id);
    if (!req.user) {
        return res.status(401).json({ error: "User not found" });
    }
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

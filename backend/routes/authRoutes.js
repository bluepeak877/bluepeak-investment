const express = require("express");
const router = express.Router();
const createRateLimiter = require("../middleware/rateLimiter");

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  claimDailyBonus,
} = require("../controllers/authController");

const {
  protect,
} = require("../middleware/authMiddleware");

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many auth attempts. Please try again later.",
});

const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many password reset attempts. Please try again later.",
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);

router.get("/profile", protect, getProfile);
router.post("/daily-bonus", protect, claimDailyBonus);

module.exports = router;

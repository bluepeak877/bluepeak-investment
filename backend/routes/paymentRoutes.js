const express = require("express");
const router = express.Router();
const createRateLimiter = require("../middleware/rateLimiter");

const {
  initializePayment,
  verifyPayment,
  securewaveWebhook,
} = require("../controllers/paymentController");

const {
  protect,
} = require("../middleware/authMiddleware");

const paymentLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many payment requests. Please try again later.",
});

// Generate Dynamic Account
router.post(
  "/initialize",
  paymentLimiter,
  protect,
  initializePayment
);

// Temporary Verify Route
router.get(
  "/verify/:transactionReference",
  protect,
  verifyPayment
);

// SecureWave Webhook
router.post(
  "/webhook",
  securewaveWebhook
);

module.exports = router;

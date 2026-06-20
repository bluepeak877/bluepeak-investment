const express = require("express");
const router = express.Router();

const {
  initializePayment,
  verifyPayment,
  securewaveWebhook,
} = require("../controllers/paymentController");

const {
  protect,
} = require("../middleware/authMiddleware");

// Generate Dynamic Account
router.post(
  "/initialize",
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
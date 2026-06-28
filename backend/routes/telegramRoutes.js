const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
  generateTelegramLink,
} = require("../controllers/telegramController");

router.post("/connect", protect, generateTelegramLink);

module.exports = router;
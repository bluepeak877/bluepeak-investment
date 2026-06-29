const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { savePlayerId } = require("../controllers/oneSignalController");

router.post("/save", protect, savePlayerId);

module.exports = router;
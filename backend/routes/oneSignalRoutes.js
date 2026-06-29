const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
  savePlayerId,
  disablePush,
} = require("../controllers/oneSignalController");

router.post("/save", protect, savePlayerId);
router.post("/disable", protect, disablePush);

module.exports = router;

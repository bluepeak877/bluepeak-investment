const express = require("express");
const router = express.Router();

const {
  createWithdrawal,
  getMyWithdrawals,
  getLatestWithdrawalAnnouncement,
} = require("../controllers/withdrawalController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createWithdrawal);
router.get("/my-withdrawals", protect, getMyWithdrawals);
router.get(
  "/latest-announcement",
  getLatestWithdrawalAnnouncement
);
router.get(
  "/latest-announcement",
  getLatestWithdrawalAnnouncement
);

module.exports = router;
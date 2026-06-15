const express = require("express");
const router = express.Router();

const { protect, adminOnly } = require("../middleware/authMiddleware");
const {
  getOverview,
  updateWithdrawalStatus,
  updateUserStatus,
  adjustUserWallet,
} = require("../controllers/adminController");

router.get("/overview", protect, adminOnly, getOverview);
router.patch("/withdrawals/:id", protect, adminOnly, updateWithdrawalStatus);
router.patch("/users/:id/status", protect, adminOnly, updateUserStatus);
router.patch("/users/:id/wallet", protect, adminOnly, adjustUserWallet);

module.exports = router;

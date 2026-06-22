const express = require("express");
const router = express.Router();

const { protect, adminOnly } =
require("../middleware/authMiddleware");

const {
  getOverview,
  updateWithdrawalStatus,
  updateUserStatus,
  adjustUserWallet,
  enableInvestmentWithdrawal,
  disableInvestmentWithdrawal,
} = require("../controllers/adminController");

router.get("/overview", protect, adminOnly, getOverview);

router.patch(
  "/withdrawals/:id",
  protect,
  adminOnly,
  updateWithdrawalStatus
);

router.patch(
  "/users/:id/status",
  protect,
  adminOnly,
  updateUserStatus
);

router.patch(
  "/users/:id/wallet",
  protect,
  adminOnly,
  adjustUserWallet
);

router.put(
  "/users/:id/enable-investment-withdrawal",
  protect,
  adminOnly,
  enableInvestmentWithdrawal
);

router.put(
  "/users/:id/disable-investment-withdrawal",
  protect,
  adminOnly,
  disableInvestmentWithdrawal
);

module.exports = router;
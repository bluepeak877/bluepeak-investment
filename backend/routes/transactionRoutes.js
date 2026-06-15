const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { getMyTransactions } = require("../controllers/transactionController");

router.get("/my-transactions", protect, getMyTransactions);

module.exports = router;
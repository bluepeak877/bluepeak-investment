const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const {
  buyPackage,
  getMyInvestments,
} = require("../controllers/investmentController");

router.post("/buy", protect, buyPackage);
router.get("/my-investments", protect, getMyInvestments);

module.exports = router;
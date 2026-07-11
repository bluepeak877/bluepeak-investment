const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadAdvertisement");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const {
  createAdvertisement,
  getAdvertisements,
  getActiveAdvertisements,
  updateAdvertisement,
  deleteAdvertisement,
  trackAdvertisementClick,
  trackAdvertisementView,
} = require("../controllers/advertisementController");

// ===============================
// CREATE ADVERTISEMENT (Admin Only)
// ===============================
router.post("/", protect, adminOnly, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("Multer Error:", err);

      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }

    createAdvertisement(req, res);
  });
});

// ===============================
// UPDATE ADVERTISEMENT (Admin Only)
// ===============================
router.put("/:id", protect, adminOnly, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }

    updateAdvertisement(req, res);
  });
});

// ===============================
// GET ALL ADVERTISEMENTS (Admin Only)
// ===============================
router.get("/", protect, adminOnly, getAdvertisements);

// ===============================
// GET ACTIVE ADVERTISEMENTS (Public)
// Used by the BluePeak App
// ===============================
router.get("/active", getActiveAdvertisements);

// ===============================
// TRACK ADVERTISEMENT CLICK (Public)
// ===============================
router.post("/:id/click", trackAdvertisementClick);

// ===============================
// TRACK ADVERTISEMENT VIEW (Public)
// ===============================
router.post("/:id/view", trackAdvertisementView);

// ===============================
// DELETE ADVERTISEMENT (Admin Only)
// ===============================
router.delete("/:id", protect, adminOnly, deleteAdvertisement);

module.exports = router;

const express = require("express");
const router = express.Router();
const createRateLimiter = require("../middleware/rateLimiter");

const { protect } = require("../middleware/authMiddleware");
const User = require("../models/user");
const sendPushNotification = require("../utils/sendPushNotification");

const testNotificationLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: "Too many test notifications. Please try again later.",
});

router.get("/send", testNotificationLimiter, protect, async (req, res) => {
  try {

    const user = await User.findById(req.user.userId);

    if (!user || !user.oneSignalId) {
      return res.status(404).json({
        message: "OneSignal ID not found",
      });
    }

    await sendPushNotification(
      user.oneSignalId,
      "BluePeak Test",
      "Congratulations! Your first push notification is working."
    );

    res.json({
      success: true,
      message: "Notification sent successfully.",
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Server Error",
    });

  }
});

module.exports = router;

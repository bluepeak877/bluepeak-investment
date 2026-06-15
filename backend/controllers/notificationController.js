const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const notifications =
      await Notification.find({
        user: req.user.userId,
      }).sort({
        createdAt: -1,
      });

    res.status(200).json({
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};
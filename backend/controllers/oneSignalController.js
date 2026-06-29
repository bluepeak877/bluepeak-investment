const User = require("../models/user");

exports.savePlayerId = async (req, res) => {
  try {
    const oneSignalId =
      typeof req.body.oneSignalId === "string"
        ? req.body.oneSignalId.trim()
        : "";

    if (!oneSignalId) {
      return res.status(400).json({
        message: "OneSignal ID is required",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.oneSignalId !== oneSignalId || !user.pushEnabled) {
      user.oneSignalId = oneSignalId;
      user.pushEnabled = true;

      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Push notification enabled",
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });

  }
};

exports.disablePush = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.oneSignalId || user.pushEnabled) {
      user.oneSignalId = "";
      user.pushEnabled = false;

      await user.save();
    }

    return res.status(200).json({
      success: true,
      message: "Push notification disabled",
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Server Error",
    });
  }
};

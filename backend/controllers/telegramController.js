const crypto = require("crypto");
const User = require("../models/user");

const generateTelegramLink = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.telegramLinkToken = token;

    await user.save();

    res.json({
      success: true,
      botUrl: `https://t.me/Bluepeakinvestmentbot?start=${token}`,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  generateTelegramLink,
};
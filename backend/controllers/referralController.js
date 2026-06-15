const User = require("../models/user");
const Transaction = require("../models/Transaction");

exports.getMyReferrals = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const referredUsers = await User.find({
      referredBy: user.referralCode,
    }).select("fullName email phone createdAt");

    const referralTransactions = await Transaction.find({
      user: user._id,
      type: "referral",
    }).sort({ createdAt: -1 });

    res.status(200).json({
      referralCode: user.referralCode,
      referralWallet: user.referralWallet || 0,
      totalReferrals: referredUsers.length,
      referredUsers,
      referralTransactions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

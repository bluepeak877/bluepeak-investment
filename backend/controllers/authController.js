const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const { checkChannelMembership } = require("../services/telegramService");
const sendPushNotification = require("../utils/sendPushNotification");

function generateReferralCode(fullName) {
  const namePart = fullName.replace(/\s+/g, "").slice(0, 4).toUpperCase();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${namePart}${randomPart}`;
}

function isValidNigerianPhone(phone) {
  const regex = /^(\+234|0)[789][01]\d{8}$/;
  return regex.test(phone);
}

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

exports.register = async (req, res) => {
  try {
    const { fullName, email, phone, password, referralCode } = req.body;

    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!isValidNigerianPhone(phone)) {
      return res.status(400).json({ message: "Invalid Nigerian phone number" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email or phone already exists",
      });
    }

    let referredBy = null;

    if (referralCode) {
      const referrer = await User.findOne({ referralCode });

      if (!referrer) {
        return res.status(400).json({
          message: "Invalid referral code",
        });
      }

      referredBy = referralCode;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword,
      referralCode: generateReferralCode(fullName),
      referredBy,
      lockedDailyBonus: 1500,
      totalBalance: 1500,
    });

    await Transaction.create({
      user: newUser._id,
      type: "bonus",
      amount: 1500,
      description: "Welcome bonus locked",
      status: "successful",
    });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        referralCode: newUser.referralCode,
        referredBy: newUser.referredBy,
        depositWallet: newUser.depositWallet,
        referralWallet: newUser.referralWallet,
        lockedDailyBonus: newUser.lockedDailyBonus,
        lockedProfit: newUser.lockedProfit,
        withdrawableWallet: newUser.withdrawableWallet,
        totalBalance: newUser.totalBalance,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        message: "Account suspended. Contact support for help.",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        referralCode: user.referralCode,
        referredBy: user.referredBy,
        depositWallet: user.depositWallet || 0,
        referralWallet: user.referralWallet || 0,
        lockedDailyBonus: user.lockedDailyBonus || 0,
        lockedProfit: user.lockedProfit || 0,
        withdrawableWallet: user.withdrawableWallet || 0,
        totalBalance: user.totalBalance || 0,
        isAdmin: user.isAdmin || false,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({
        message: "If an account exists, a password reset link has been generated.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = hashResetToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 1000 * 60 * 30);

    await user.save();

    const baseUrl =
      process.env.FRONTEND_URL ||
      `${req.protocol}://${req.get("host")}`;
    const resetLink = `${baseUrl}/reset-password.html?token=${resetToken}`;

    console.log("PASSWORD RESET LINK:", resetLink);

    res.status(200).json({
      message: "Password reset link generated. Check the server console in development.",
      resetLink,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const user = await User.findOne({
      passwordResetToken: hashResetToken(token),
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Password reset link is invalid or has expired",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();

    res.status(200).json({
      message: "Password reset successful. You can now login.",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.claimDailyBonus = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Telegram must be connected
    if (!user.telegramConnected || !user.telegramId) {
      return res.status(400).json({
        message: "Please connect your Telegram account first.",
      });
    }

    // Verify Telegram channel membership
    const isMember = await checkChannelMembership(user.telegramId);
    console.log("Membership Check:", isMember);

    if (!isMember) {
      return res.status(400).json({
        message:
          "Please join our Telegram channel before claiming your daily bonus.",
      });
    }

    const now = new Date();
    

    if (user.lastTelegramBonusClaim) {
      const lastClaim = new Date(user.lastTelegramBonusClaim);
      const diffHours = (now - lastClaim) / (1000 * 60 * 60);

      if (diffHours < 24) {
        return res.status(400).json({
          message: "Telegram daily bonus already claimed today",
        });
      }
    }

    user.lockedDailyBonus = (user.lockedDailyBonus || 0) + 100;

    user.totalBalance =
      (user.depositWallet || 0) +
      (user.referralWallet || 0) +
      (user.withdrawableWallet || 0) +
      (user.lockedDailyBonus || 0) +
      (user.lockedProfit || 0);

    user.lastTelegramBonusClaim = now;
    user.dailyLoginClaimedAt = now;

    await user.save();

    await createActivity(
      user,
      "bonus",
      `${user.fullName} claimed today's daily bonus`,
      100
    );

    await Transaction.create({
      user: user._id,
      type: "bonus",
      amount: 100,
      description: "Daily login bonus locked",
      status: "successful",
    });

    await Notification.create({
      user: user._id,
      title: "Daily Bonus Claimed",
      message: "₦100 daily login bonus has been added to your locked bonus wallet.",
    });

    await sendPushNotification(
      user.oneSignalId,
      "🎁 Daily Bonus Claimed",
      "₦100 has been added to your locked daily bonus wallet."
    );

    res.status(200).json({
      message: "Daily bonus claimed successfully",
      lockedDailyBonus: user.lockedDailyBonus,
      totalBalance: user.totalBalance,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

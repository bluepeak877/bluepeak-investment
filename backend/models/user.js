const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    passwordResetToken: {
      type: String,
      default: null,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
    },

    referralCode: {
      type: String,
      unique: true,
    },

    referredBy: {
      type: String,
      default: null,
    },

    // Money user deposited by themselves
    // Can be used to buy package or withdraw
    depositWallet: {
      type: Number,
      default: 0,
    },

    // Referral bonus
    // Can be used to buy package or withdraw
    referralWallet: {
      type: Number,
      default: 0,
    },

    // Daily login bonus
    // Locked until package duration ends
    lockedDailyBonus: {
      type: Number,
      default: 0,
    },

    // ROI / investment profit
    // Locked until package duration ends
    lockedProfit: {
      type: Number,
      default: 0,
    },

    // Unlocked profit/bonus after package completion
    withdrawableWallet: {
      type: Number,
      default: 0,
    },

    // Display only
    totalBalance: {
      type: Number,
      default: 0,
    },

    dailyLoginClaimedAt: {
      type: Date,
      default: null,
    },

    isAdmin: {
      type: Boolean,
      default: false,
    },

    isSuspended: {
      type: Boolean,
      default: false,
    },

    level: {
      type: String,
      default: "BluePeak Starter"
    },

    totalInvested: {
      type: Number,
      default: 0
    },
    investmentWithdrawalEnabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

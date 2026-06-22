const mongoose = require("mongoose");

const withdrawalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    bankName: {
      type: String,
      required: true,
    },

    accountNumber: {
      type: String,
      required: true,
    },

    accountName: {
      type: String,
      required: true,
    },

    walletBreakdown: {

      referralWallet: {
        type: Number,
        default: 0,
      },

      withdrawableWallet: {
        type: Number,
        default: 0,
      },
    },
    
    withdrawalType: {
      type: String,
      enum: ["normal", "emergency"],
      default: "normal",
    },

    charge: {
      type: Number,
      default: 0,
    },

    netAmount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    adminNote: {
      type: String,
      default: "",
    },
    
  },
  { timestamps: true }
);

module.exports = mongoose.model("Withdrawal", withdrawalSchema);
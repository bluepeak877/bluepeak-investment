const mongoose = require("mongoose");

const investmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    packageName: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    dailyROI: {
      type: Number,
      default: 10,
    },

    durationDays: {
      type: Number,
      default: 90,
    },

    totalReturn: {
      type: Number,
      required: true,
    },

    profitEarned: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Investment", investmentSchema);
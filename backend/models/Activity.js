const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    name: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "deposit",
        "withdrawal",
        "investment",
        "bonus",
        "referral",
        "profit",
      ],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Activity", activitySchema);
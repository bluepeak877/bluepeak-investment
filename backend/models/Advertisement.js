const mongoose = require("mongoose");

const advertisementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    image: {
      type: String,
      required: true,
    },

    buttonText: {
      type: String,
      default: "Learn More",
    },

    linkType: {
      type: String,
      enum: [
        "packages",
        "referral",
        "deposit",
        "withdrawal",
        "dashboard",
        "dailyBonus",
        "custom",
      ],
      default: "packages",
    },

    linkValue: {
      type: String,
      default: "",
    },

    placement: {
      type: String,
      enum: [
        "dashboard",
        "packages",
        "wallet",
        "referral",
        "all",
      ],
      default: "dashboard",
    },

    displayOrder: {
      type: Number,
      default: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
    },

    views: {
      type: Number,
      default: 0,
    },

    clicks: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Advertisement", advertisementSchema);
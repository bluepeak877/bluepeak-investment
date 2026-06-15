const mongoose = require("mongoose");

const withdrawalAnnouncementSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "WithdrawalAnnouncement",
  withdrawalAnnouncementSchema
);
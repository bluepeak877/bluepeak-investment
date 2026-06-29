const Withdrawal = require("../models/Withdrawal");
const User = require("../models/user");
const Transaction = require("../models/Transaction");
const WithdrawalAnnouncement = require("../models/WithdrawalAnnouncement");
const createActivity = require("../utils/createActivity");
const sendPushNotification = require("../utils/sendPushNotification");

exports.createWithdrawal = async (req, res) => {
  try {
    const {
      amount,
      bankName,
      accountNumber,
      accountName,
    } = req.body;

    const withdrawalAmount = Number(amount);

    if (
      !withdrawalAmount ||
      withdrawalAmount <= 0 ||
      !bankName ||
      !accountNumber ||
      !accountName
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const availableBalance =
      Number(user.depositWallet || 0) +
      Number(user.referralWallet || 0) +
      Number(user.withdrawableWallet || 0);

    if (withdrawalAmount > availableBalance) {
      return res.status(400).json({
        message: "Insufficient available balance",
      });
    }

    const walletBreakdown = {
      depositWallet: 0,
      referralWallet: 0,
      withdrawableWallet: 0,
    };

    let remaining = withdrawalAmount;

    // Deduct from withdrawable wallet first
    if (user.withdrawableWallet >= remaining) {
      walletBreakdown.withdrawableWallet = remaining;
      user.withdrawableWallet -= remaining;
      remaining = 0;
    } else {
      walletBreakdown.withdrawableWallet =
        user.withdrawableWallet;

      remaining -= user.withdrawableWallet;
      user.withdrawableWallet = 0;
    }

    // Deduct from referral wallet
    if (remaining > 0) {
      if (user.referralWallet >= remaining) {
        walletBreakdown.referralWallet = remaining;
        user.referralWallet -= remaining;
        remaining = 0;
      } else {
        walletBreakdown.referralWallet =
          user.referralWallet;

        remaining -= user.referralWallet;
        user.referralWallet = 0;
      }
    }

    // Deduct from deposit wallet
    if (remaining > 0) {
      walletBreakdown.depositWallet = remaining;
      user.depositWallet -= remaining;
      remaining = 0;
    }

    const withdrawal = await Withdrawal.create({
      user: user._id,
      amount: withdrawalAmount,
      bankName,
      accountNumber,
      accountName,
      walletBreakdown,
    });

    await Transaction.create({
      user: user._id,
      type: "withdrawal",
      amount: withdrawalAmount,
      description: "Withdrawal Request",
      status: "pending",
    });

    user.totalBalance =
      Number(user.depositWallet || 0) +
      Number(user.referralWallet || 0) +
      Number(user.withdrawableWallet || 0) +
      Number(user.lockedDailyBonus || 0) +
      Number(user.lockedProfit || 0);

    await user.save();

    await sendPushNotification(
      user.oneSignalId,
      "Withdrawal Submitted",
      `Your withdrawal request of ₦${withdrawalAmount.toLocaleString()} has been submitted successfully and is awaiting approval.`
    );


    res.status(201).json({
      message: "Withdrawal request submitted",
      withdrawal,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getMyWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({
      user: req.user.userId,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      withdrawals,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.approveWithdrawal = async (req, res) => {
  try {

    const withdrawal = await Withdrawal.findById(
      req.params.id
    ).populate("user");

    if (!withdrawal) {
      return res.status(404).json({
        message: "Withdrawal not found",
      });
    }

    if (withdrawal.status === "approved") {
      return res.status(400).json({
        message: "Already approved",
      });
    }

    withdrawal.status = "approved";

    await withdrawal.save();

    // Replace old announcement
    await WithdrawalAnnouncement.deleteMany({});

    // Create new announcement
    await WithdrawalAnnouncement.create({
      fullName: withdrawal.user.fullName,
      amount: withdrawal.amount,
    });

    await Transaction.findOneAndUpdate(
      {
        user: withdrawal.user._id,
        type: "withdrawal",
        amount: withdrawal.amount,
        status: "pending",
      },
      {
        status: "successful",
      }
    );

   const approvedAmount =
    withdrawal.withdrawalType === "emergency"
      ? withdrawal.netAmount
      : withdrawal.amount;

  await sendPushNotification(
    withdrawal.user.oneSignalId,
    "Withdrawal Approved",
    `Your withdrawal of ₦${approvedAmount.toLocaleString()} has been approved and will be credited to your bank account shortly.`
  );

  await createActivity(
    withdrawal.user,
    "withdrawal",
    `${withdrawal.user.fullName} successfully withdrew ₦${approvedAmount.toLocaleString()}`,
    approvedAmount
  );
    
    res.status(200).json({
      message: "Withdrawal approved successfully",
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });

  }
};
exports.getLatestWithdrawalAnnouncement =
  async (req, res) => {
    try {

      const announcement =
        await WithdrawalAnnouncement.findOne()
        .sort({ createdAt: -1 });

      res.status(200).json({
        announcement,
      });

    } catch (error) {

      res.status(500).json({
        message: error.message,
      });

    }
};


exports.createEmergencyWithdrawal = async (req, res) => {
  try {
    const {amount} = req.body;

    const withdrawalAmount = Number(amount);

    if (
      !withdrawalAmount ||
      withdrawalAmount <= 0
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check if admin enabled emergency withdrawals
    if (!user.investmentWithdrawalEnabled) {
      return res.status(400).json({
        message:
          "Emergency Investment Profit Withdrawal is currently unavailable.",
      });
    }

    // Check for existing pending withdrawal
    const pendingWithdrawal =
      await Withdrawal.findOne({
        user: user._id,
        status: "pending",
      });

    if (pendingWithdrawal) {
      return res.status(400).json({
        message:
          "You already have a pending withdrawal request.",
      });
    }

    const lockedProfit =
      Number(user.lockedProfit || 0);

    if (withdrawalAmount > lockedProfit) {
      return res.status(400).json({
        message:
          "Insufficient investment profit.",
      });
    }

    const charge =
      withdrawalAmount * 0.3;

    const netAmount =
      withdrawalAmount - charge;

    const withdrawal =
      await Withdrawal.create({
        user: user._id,
        amount: withdrawalAmount,
        bankName: "Profit Conversion",
        accountNumber: "N/A",
        accountName:user.fullName,
        withdrawalType: "emergency",
        charge,
        netAmount,
      });

    await Transaction.create({
      user: user._id,
      type: "withdrawal",
      amount: withdrawalAmount,
      description:
        "Emergency Investment Profit Withdrawal",
      status: "pending",
    });

    await sendPushNotification(
      user.oneSignalId,
      "Withdrawal Submitted",
      `Your emergency investment withdrawal request of ₦${withdrawalAmount.toLocaleString()} has been submitted for review.`
    );

    res.status(201).json({
      message:
        "Emergency withdrawal request submitted successfully.",
      withdrawal,
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });

  }
};
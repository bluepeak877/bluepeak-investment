const User = require("../models/user");
const Withdrawal = require("../models/Withdrawal");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const Investment = require("../models/Investment");
const WithdrawalAnnouncement = require(
  "../models/WithdrawalAnnouncement"
);

function calculateTotalBalance(user) {
  return (
    (user.depositWallet || 0) +
    (user.referralWallet || 0) +
    (user.withdrawableWallet || 0) +
    (user.lockedDailyBonus || 0) +
    (user.lockedProfit || 0)
  );
}

exports.getOverview = async (req, res) => {
  try {
    const [users, withdrawals, transactions, investments] = await Promise.all([
      User.find().select("-password").sort({ createdAt: -1 }),
      Withdrawal.find().populate("user", "fullName email").sort({ createdAt: -1 }),
      Transaction.find().populate("user", "fullName email").sort({ createdAt: -1 }),
      Investment.find().populate("user", "fullName email").sort({ createdAt: -1 }),
    ]);

    const successfulDeposits = transactions.filter(
      (tx) => tx.type === "deposit" && tx.status === "successful"
    );
    const investmentTransactions = transactions.filter(
      (tx) => tx.type === "investment" && tx.status === "successful"
    );
    const approvedWithdrawals = withdrawals.filter((w) => w.status === "approved");
    const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");

    res.status(200).json({
      users,
      withdrawals,
      transactions: transactions.slice(0, 30),
      investments: investments.slice(0, 30),
      stats: {
        totalUsers: users.length,
        activeUsers: users.filter((user) => !user.isSuspended).length,
        suspendedUsers: users.filter((user) => user.isSuspended).length,
        pendingWithdrawals: pendingWithdrawals.length,
        totalDeposits: successfulDeposits.reduce((sum, tx) => sum + tx.amount, 0),
        totalInvested: investmentTransactions.reduce((sum, tx) => sum + tx.amount, 0),
        totalWithdrawals: approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0),
        activeInvestments: investments.filter((investment) => investment.status === "active").length,
        totalUserBalances: users.reduce((sum, user) => sum + calculateTotalBalance(user), 0),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { isSuspended } = req.body;

    if (typeof isSuspended !== "boolean") {
      return res.status(400).json({ message: "isSuspended must be true or false" });
    }

    if (req.params.id === req.user.userId) {
      return res.status(400).json({ message: "You cannot suspend your own admin account" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isSuspended = isSuspended;
    await user.save();

    await Notification.create({
      user: user._id,
      title: isSuspended ? "Account Suspended" : "Account Restored",
      message: isSuspended
        ? "Your BluePeak account has been suspended. Contact support for help."
        : "Your BluePeak account has been restored.",
    });

    res.status(200).json({
      message: isSuspended ? "User suspended" : "User restored",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        isSuspended: user.isSuspended,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.adjustUserWallet = async (req, res) => {
  try {
    const { walletType, action, amount, description } = req.body;
    const adjustmentAmount = Number(amount);
    const allowedWallets = ["depositWallet", "referralWallet", "withdrawableWallet"];

    if (!allowedWallets.includes(walletType)) {
      return res.status(400).json({ message: "Invalid wallet selected" });
    }

    if (!["credit", "debit"].includes(action)) {
      return res.status(400).json({ message: "Invalid wallet action" });
    }

    if (!adjustmentAmount || adjustmentAmount <= 0) {
      return res.status(400).json({ message: "Enter a valid amount" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (action === "debit" && (user[walletType] || 0) < adjustmentAmount) {
      return res.status(400).json({ message: "Insufficient wallet balance for debit" });
    }

    user[walletType] =
      action === "credit"
        ? (user[walletType] || 0) + adjustmentAmount
        : (user[walletType] || 0) - adjustmentAmount;

    user.totalBalance = calculateTotalBalance(user);
    await user.save();

    const readableWallet = walletType
      .replace("Wallet", " wallet")
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .trim();

    await Transaction.create({
      user: user._id,
      type: "adjustment",
      amount: adjustmentAmount,
      description:
        description ||
        `Admin ${action} on ${readableWallet}`,
      status: "successful",
    });

    await Notification.create({
      user: user._id,
      title: "Wallet Updated",
      message: `Admin ${action} of NGN ${adjustmentAmount.toLocaleString()} was applied to your ${readableWallet}.`,
    });

    res.status(200).json({
      message: `Wallet ${action} successful`,
      user: {
        id: user._id,
        fullName: user.fullName,
        depositWallet: user.depositWallet,
        referralWallet: user.referralWallet,
        withdrawableWallet: user.withdrawableWallet,
        totalBalance: user.totalBalance,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateWithdrawalStatus = async (req, res) => {
  try {
    console.log("ADMIN APPROVAL FUNCTION HIT");
    const { status, adminNote } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid withdrawal status",
      });
    }

    const withdrawal = await Withdrawal.findById(
      req.params.id
    );

    if (!withdrawal) {
      return res.status(404).json({
        message: "Withdrawal not found",
      });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        message: "Withdrawal has already been reviewed",
      });
    }

    const user = await User.findById(
      withdrawal.user
    );
    console.log("BEFORE");
    console.log("withdrawableWallet:", user.withdrawableWallet);
    console.log("convertedProfit:", user.convertedProfit);
    console.log("lockedProfit:", user.lockedProfit);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    withdrawal.status = status;
    withdrawal.adminNote = adminNote || "";

    await Transaction.findOneAndUpdate(
      {
        user: user._id,
        type: "withdrawal",
        amount: withdrawal.amount,
      },
      {
        status,
      }
    );

    // REJECTED
    if (status === "rejected") {

      if (withdrawal.withdrawalType === "normal") {

        user.depositWallet += Number(
          withdrawal.walletBreakdown?.depositWallet || 0
        );

        user.referralWallet += Number(
          withdrawal.walletBreakdown?.referralWallet || 0
        );

        user.withdrawableWallet += Number(
          withdrawal.walletBreakdown?.withdrawableWallet || 0
        );

      }

      user.totalBalance =
        calculateTotalBalance(user);

      await user.save();
      const verifyUser = await User.findById(user._id);

      console.log("AFTER SAVE");
      console.log("withdrawableWallet:", verifyUser.withdrawableWallet);
      console.log("convertedProfit:", verifyUser.convertedProfit);
      console.log("lockedProfit:", verifyUser.lockedProfit);
          }

    // APPROVED
    if (status === "approved") {
      console.log("APPROVED BLOCK HIT");

      if (
        true
      ) {
        console.log("EMERGENCY BLOCK HIT");

        // Track converted profit permanently
        user.convertedProfit =
          Number(user.convertedProfit || 0) +
          Number(withdrawal.amount || 0);

        // Add net amount after charge
        user.withdrawableWallet =
          Number(user.withdrawableWallet || 0) +
          Number(withdrawal.netAmount || 0);

        // Update locked profit display immediately
        user.lockedProfit = Math.max(
          0,
          Number(user.lockedProfit || 0) -
          Number(withdrawal.amount || 0)
        );

        user.totalBalance =
          calculateTotalBalance(user);

        await user.save();
      }

      await WithdrawalAnnouncement.deleteMany(
        {}
      );

      await WithdrawalAnnouncement.create({
        fullName: user.fullName,
        amount:
          withdrawal.netAmount > 0
            ? withdrawal.netAmount
            : withdrawal.amount,
      });
    }

    await withdrawal.save();

    await Notification.create({
      user: user._id,
      title: `Withdrawal ${status}`,
      message:
        status === "approved"
          ? `Your withdrawal of NGN ${withdrawal.amount.toLocaleString()} has been approved.`
          : `Your withdrawal of NGN ${withdrawal.amount.toLocaleString()} was rejected and refunded.`,
    });

    res.status(200).json({
      message: `Withdrawal ${status}`,
      withdrawal,
    });

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });

  }
};

exports.enableInvestmentWithdrawal = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.investmentWithdrawalEnabled = true;

    await user.save();

    await Notification.create({
      user: user._id,
      title: "Investment Withdrawal Enabled",
      message:
        "Emergency Investment Profit Withdrawal has been enabled for your account.",
    });

    res.status(200).json({
      message: "Investment withdrawal enabled successfully",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};

exports.disableInvestmentWithdrawal = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.investmentWithdrawalEnabled = false;

    await user.save();

    await Notification.create({
      user: user._id,
      title: "Investment Withdrawal Disabled",
      message:
        "Emergency Investment Profit Withdrawal has been disabled for your account.",
    });

    res.status(200).json({
      message: "Investment withdrawal disabled successfully",
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }
};
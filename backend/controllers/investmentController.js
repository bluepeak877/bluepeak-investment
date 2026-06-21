const User = require("../models/user");
const Investment = require("../models/Investment");
const Transaction = require("../models/Transaction");
const Notification = require("../models/Notification");
const calculateLevel = require("../utils/levelCalculator");

const packages = {
  breeze: { name: "BluePeak Breeze", amount: 3000 },
  wave: { name: "BluePeak Wave", amount: 10000 },
  horizon: { name: "BluePeak Horizon", amount: 30000 },
  summit: { name: "BluePeak Summit", amount: 60000 },
  infinity: { name: "BluePeak Infinity", amount: 100000 },
  elite: { name: "BluePeak Elite", amount: 200000 },
  prime: { name: "BluePeak Prime", amount: 500000 },
  royal: { name: "BluePeak Royal", amount: 1000000 },
  platinum: { name: "BluePeak Platinum", amount: 2000000 },
  diamond: { name: "BluePeak Diamond", amount: 5000000 },
};

exports.buyPackage = async (req, res) => {
  try {
    const { packageKey } = req.body;
    const userId = req.user.userId;

    const selectedPackage = packages[packageKey];

    if (!selectedPackage) {
      return res.status(400).json({
        message: "Invalid package selected",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const spendableBalance =
      (user.depositWallet || 0) +
      (user.referralWallet || 0) +
      (user.withdrawableWallet || 0);

    if (spendableBalance < selectedPackage.amount) {
      return res.status(400).json({
        message:
          "Insufficient spendable balance. Locked bonus/profit cannot be used until package duration ends.",
      });
    }

    let remainingAmount = selectedPackage.amount;

    if (user.depositWallet >= remainingAmount) {
      user.depositWallet -= remainingAmount;
      remainingAmount = 0;
    } else {
      remainingAmount -= user.depositWallet;
      user.depositWallet = 0;
    }

    if (remainingAmount > 0) {
      if (user.referralWallet >= remainingAmount) {
        user.referralWallet -= remainingAmount;
        remainingAmount = 0;
      } else {
        remainingAmount -= user.referralWallet;
        user.referralWallet = 0;
      }
    }

    if (remainingAmount > 0) {
      user.withdrawableWallet -= remainingAmount;
      remainingAmount = 0;
    }

    const endDate = new Date();

    const dailyROI = 5;
    const durationDays = 90;

    endDate.setDate(endDate.getDate() + durationDays);

    const totalReturn =
      ((selectedPackage.amount * dailyROI) / 100) *
        durationDays;

    const investment = await Investment.create({
      user: user._id,
      packageName: selectedPackage.name,
      amount: selectedPackage.amount,
      dailyROI,
      durationDays,
      totalReturn,
      endDate,
    });

    user.totalInvested = (user.totalInvested || 0) + selectedPackage.amount;
    user.level = calculateLevel(user.totalInvested);
    
    user.totalBalance =
      (user.depositWallet || 0) +
      (user.referralWallet || 0) +
      (user.withdrawableWallet || 0) +
      (user.lockedDailyBonus || 0) +
      (user.lockedProfit || 0);

    await user.save();

    await Transaction.create({
      user: user._id,
      type: "investment",
      amount: selectedPackage.amount,
      description: `${selectedPackage.name} package purchased`,
      status: "successful",
    });

    await Notification.create({
      user: user._id,
      title: "Investment Purchased",
      message: `You successfully purchased ${selectedPackage.name} for ₦${selectedPackage.amount.toLocaleString()}.`,
    });

    if (user.referredBy) {
      const referrer = await User.findOne({
        referralCode: user.referredBy,
      });

      if (referrer) {
        const referralBonus = selectedPackage.amount * 0.3;

        referrer.referralWallet =
          (referrer.referralWallet || 0) + referralBonus;

        referrer.totalBalance =
          (referrer.depositWallet || 0) +
          (referrer.referralWallet || 0) +
          (referrer.withdrawableWallet || 0) +
          (referrer.lockedDailyBonus || 0) +
          (referrer.lockedProfit || 0);

        await referrer.save();

        await Transaction.create({
          user: referrer._id,
          type: "referral",
          amount: referralBonus,
          description: `Referral bonus from ${selectedPackage.name} purchase`,
          status: "successful",
        });

        await Notification.create({
          user: referrer._id,
          title: "Referral Bonus Received",
          message: `You received ₦${referralBonus.toLocaleString()} referral bonus from a package purchase.`,
        });
      }
    }

    res.status(201).json({
      message: "Investment package purchased successfully",
      investment,
      wallets: {
        depositWallet: user.depositWallet,
        referralWallet: user.referralWallet,
        withdrawableWallet: user.withdrawableWallet,
        lockedDailyBonus: user.lockedDailyBonus,
        lockedProfit: user.lockedProfit,
        totalBalance: user.totalBalance,
        level: user.level,
        totalInvested:user.totalInvested
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

exports.getMyInvestments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const investments = await Investment.find({
      user: userId,
    }).sort({
      createdAt: -1,
    });

    const today = new Date();

    const updatedInvestments = [];
    let totalLockedProfit = 0;

    for (const investment of investments) {
      const startDate = new Date(investment.startDate);
      const endDate = new Date(investment.endDate);

      const daysPassed = Math.max(
        0,
        Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
      );

      const validDays = Math.min(daysPassed, investment.durationDays);

      const profitEarned =
        ((investment.amount * investment.dailyROI) / 100) * validDays;
      if (
        investment.status === "active" &&
        today >= endDate
      ) {
        investment.status = "completed";
        investment.profitEarned = profitEarned;

        user.withdrawableWallet =
          (user.withdrawableWallet || 0) + investment.totalReturn;

        if ((user.lockedDailyBonus || 0) > 0) {
          user.withdrawableWallet += user.lockedDailyBonus;
          user.lockedDailyBonus = 0;
        }

        user.totalBalance =
          (user.depositWallet || 0) +
          (user.referralWallet || 0) +
          (user.withdrawableWallet || 0) +
          (user.lockedDailyBonus || 0) +
          (user.lockedProfit || 0);

        await investment.save();
        await user.save();

        await Transaction.create({
          user: user._id,
          type: "profit",
          amount: investment.totalReturn,
          description: `${investment.packageName} completed. Total return unlocked.`,
          status: "successful",
        });

        await Notification.create({
          user: user._id,
          title: "Investment Completed",
          message: `${investment.packageName} has matured. ₦${investment.totalReturn.toLocaleString()} is now withdrawable.`,
        });
      }

      if (investment.status === "active") {
        totalLockedProfit += profitEarned;
      }

      updatedInvestments.push({
        ...investment.toObject(),
        profitEarned,
      });
    }

    user.lockedProfit = totalLockedProfit;

    user.totalBalance =
      (user.depositWallet || 0) +
      (user.referralWallet || 0) +
      (user.withdrawableWallet || 0) +
      (user.lockedDailyBonus || 0) +
      (user.lockedProfit || 0);

    await user.save();

    res.status(200).json({
      message: "Investments fetched successfully",
      investments: updatedInvestments,
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

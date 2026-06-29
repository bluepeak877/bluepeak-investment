const axios = require("axios");
const User = require("../models/user");
const Transaction = require("../models/Transaction");
const createActivity = require("../utils/createActivity");
const sendPushNotification = require("../utils/sendPushNotification");

// ===============================
// Generate Dynamic Account
// ===============================
exports.initializePayment = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({
        message: "Minimum deposit is ₦100",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const response = await axios.post(
      `${process.env.SECUREWAVE_BASE_URL}/dynamic_accounts/generate`,
      {
        email: user.email,
        first_name:
          user.fullName?.split(" ")[0] || "BluePeak",

        last_name:
          user.fullName?.split(" ")[1] || "User",

        phone_number:
          user.phone || "08000000000",

        bank_code: [3],

        business_id:
          process.env.SECUREWAVE_BUSINESS_ID,

        account_type: "dynamic",

        amount: Number(amount),
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SECUREWAVE_SECRET_KEY}`,
          "x-api-key":
            process.env.SECUREWAVE_PUBLIC_KEY,
        },
      }
    );

    return res.status(200).json({
      success: true,
      data: response.data,
    });

  } catch (error) {

    console.log("SECUREWAVE ERROR");

    console.log(
      error.response?.data ||
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to generate account",
      error:
        error.response?.data ||
        error.message,
    });

  }
};

// ===============================
// Verify Route
// ===============================
exports.verifyPayment = async (req, res) => {
  try {

    return res.status(200).json({
      success: true,
      message:
        "SecureWave uses webhook verification",
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Verification failed",
    });

  }
};

// ===============================
// SecureWave Webhook
// ===============================
exports.securewaveWebhook = async (req, res) => {

  console.log("================================");
  console.log("WEBHOOK HIT");
  console.log(JSON.stringify(req.body, null, 2));
  console.log("================================");

  try {

    const payload = req.body;

    if (
      payload.notification_status !==
        "payment_successful" ||
      payload.transaction_status !==
        "success"
    ) {
      return res.status(200).json({
        message: "Payment not successful",
      });
    }

    const amount = Number(
      payload.amount || 0
    );

    const reference =
      payload.transaction_id;

    const email =
      payload.customer?.email;

    console.log(
      "WEBHOOK EMAIL:",
      email
    );

    // Prevent duplicate credit
    const existingTransaction =
      await Transaction.findOne({
        description: reference,
      });

    if (existingTransaction) {
      return res.status(200).json({
        message: "Already processed",
      });
    }

    const user =
      await User.findOne({
        email: email,
      });

    console.log(
      "USER FOUND:",
      user
    );

    if (!user) {

      console.log(
        "USER NOT FOUND"
      );

      return res.status(404).json({
        message: "User not found",
      });

    }

    // Credit wallet
    user.depositWallet =
      Number(
        user.depositWallet || 0
      ) + amount;

    user.totalBalance =
      Number(
        user.depositWallet || 0
      ) +
      Number(
        user.referralWallet || 0
      ) +
      Number(
        user.withdrawableWallet || 0
      ) +
      Number(
        user.lockedDailyBonus || 0
      ) +
      Number(
        user.lockedProfit || 0
      );

    await user.save();

    await Transaction.create({
      user: user._id,
      type: "deposit",
      amount,
      description: reference,
      status: "successful",
    });

    await sendPushNotification(
      user.oneSignalId,
      "Deposit Successful",
      `₦${amount.toLocaleString()} has been credited to your BluePeak wallet.`
    );

    await createActivity(
      user,
      "deposit",
      `${user.fullName} deposited ₦${amount.toLocaleString()}`,
      amount
    );

    console.log(
      "WALLET CREDITED:",
      amount
    );

    return res.status(200).json({
      success: true,
      message:
        "Wallet funded successfully",
    });

  } catch (error) {

    console.log(
      "WEBHOOK ERROR"
    );

    console.log(error);

    return res.status(500).json({
      success: false,
      message:
        "Webhook processing failed",
    });

  }

};
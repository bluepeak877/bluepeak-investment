const axios = require("axios");
const User = require("../models/user");
const Transaction = require("../models/Transaction");

const getAccessToken = async () => {
  const credentials = Buffer.from(
    `${process.env.MONNIFY_API_KEY}:${process.env.MONNIFY_SECRET_KEY}`
  ).toString("base64");

  console.log("Getting Monnify access token...");

  const response = await axios.post(
    `${process.env.MONNIFY_BASE_URL}/api/v1/auth/login`,
    {},
    {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  return response.data.responseBody.accessToken;
};

exports.initializePayment = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({
        message: "Enter a valid amount",
      });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const accessToken = await getAccessToken();

    const paymentReference = `BP_${Date.now()}`;

    const response = await axios.post(
      `${process.env.MONNIFY_BASE_URL}/api/v1/merchant/transactions/init-transaction`,
      {
        amount: Number(amount),
        customerName: user.fullName,
        customerEmail: user.email,
        paymentReference,
        paymentDescription: "BluePeak Wallet Funding",
        currencyCode: "NGN",
        contractCode: process.env.MONNIFY_CONTRACT_CODE,
        redirectUrl:
          "http://127.0.0.1:5500/frontend/dashboard.html",
        paymentMethods: [
          "CARD",
          "ACCOUNT_TRANSFER",
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json(response.data);

  } catch (error) {

    console.log("MONNIFY ERROR:");
    console.log(
      error.response?.data ||
      error.message
    );

    res.status(500).json({
      message: "Failed to initialize payment",
      error:
        error.response?.data ||
        error.message,
    });

  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { transactionReference } = req.params;

    const user = await User.findById(
      req.user.userId
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const accessToken =
      await getAccessToken();
const encodedReference =
  encodeURIComponent(
    transactionReference
  );

console.log(
  "VERIFYING:",
  transactionReference
);

console.log(
  "ENCODED:",
  encodedReference
);

const response = await axios.get(
  `${process.env.MONNIFY_BASE_URL}/api/v2/transactions/${encodedReference}`,
  {
    headers: {
      Authorization:
        `Bearer ${accessToken}`,
    },
  }
);

    const payment =
      response.data.responseBody;

    console.log("VERIFY RESPONSE:");
    console.log(payment);

    // Don't credit twice
    const existingTransaction =
      await Transaction.findOne({
        description:
          transactionReference,
      });

    if (existingTransaction) {
      return res.status(400).json({
        message:
          "Payment already credited",
      });
    }

    // Check payment status
    if (
      payment.paymentStatus !==
      "PAID"
    ) {
      return res.status(400).json({
        message:
          "Payment not completed",
      });
    }

    const amount = Number(
      payment.amountPaid ||
      payment.amount ||
      0
    );
      

    user.depositWallet =  Number(user.depositWallet || 0) + amount;

    user.totalBalance =
      Number(user.depositWallet || 0) +
      Number(user.referralWallet || 0) +
      Number(user.withdrawableWallet || 0) +
      Number(user.lockedDailyBonus || 0) +
      Number(user.lockedProfit || 0);

    console.log({
      amount,
      amountType: typeof amount,
      dopsiWallet: user.depositWallet,
      totalBalance: user.totalBalance,
    });
    await user.save();

    await Transaction.create({
      user: user._id,
      type: "deposit",
      amount,
      description:
        transactionReference,
      status: "successful",
    });

    res.status(200).json({
      message:
        "Wallet funded successfully",
      depositWallet:
        user.depositWallet,
      totalBalance:
        user.totalBalance,
    });

  } catch (error) {

    console.log("VERIFY ERROR:");
    console.log(
      error.response?.data ||
      error.message
    );

    res.status(500).json({
      message:
        "Payment verification failed",
      error:
        error.response?.data ||
        error.message,
    });

  }
};

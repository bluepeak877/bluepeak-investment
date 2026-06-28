const TelegramBot = require("node-telegram-bot-api").default;
const User = require("./models/user");

const token = process.env.TELEGRAM_BOT_TOKEN;

const bot = new TelegramBot(token, {
  polling: true,
});

bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  try {
    const telegramToken = match[1];

    // User opened bot normally
    if (!telegramToken) {
      return bot.sendMessage(
        msg.chat.id,
        `👋 Welcome to BluePeak Investment!

To connect your Telegram account, please return to your BluePeak dashboard and click:

🎁 Daily Bonus

The app will automatically generate a secure connection link for you.`
      );
    }

    // Find BluePeak user
    const user = await User.findOne({
      telegramLinkToken: telegramToken,
    });

    if (!user) {
      return bot.sendMessage(
        msg.chat.id,
        "❌ Invalid or expired connection link."
      );
    }

    // Save Telegram details
    user.telegramConnected = true;
    user.telegramId = msg.from.id.toString();
    user.telegramUsername = msg.from.username || "";
    user.telegramFirstName = msg.from.first_name || "";
    user.telegramLinkToken = "";

    await user.save();

    await bot.sendMessage(
      msg.chat.id,
      `✅ Telegram connected successfully!

Now return to BluePeak and tap 🎁 Daily Bonus again.

We'll verify that you've joined our Telegram channel before awarding today's bonus.`
    );

    console.log("Telegram Connected");

    console.log({
      user: user.email,
      telegramId: msg.from.id,
      username: msg.from.username,
    });

  } catch (err) {

    console.error(err);

    try {
      await bot.sendMessage(
        msg.chat.id,
        "Something went wrong. Please try again."
      );
    } catch {}

  }
});

module.exports = bot;
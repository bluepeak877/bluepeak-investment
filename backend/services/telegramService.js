const TelegramBot = require("node-telegram-bot-api").default;

const bot = new TelegramBot(
  process.env.TELEGRAM_BOT_TOKEN,
  {
    polling: false,
  }
);

async function checkChannelMembership(telegramId) {
  try {

    const member = await bot.getChatMember(
      process.env.TELEGRAM_CHANNEL,
      telegramId
    );

    return [
      "creator",
      "administrator",
      "member"
    ].includes(member.status);

  } catch (err) {

    console.log("Telegram Check Error:");
    console.log(err);

    return false;
  }
}

module.exports = {
  checkChannelMembership,
};
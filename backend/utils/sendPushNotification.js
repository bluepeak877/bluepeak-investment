const axios = require("axios");

module.exports = async function sendPushNotification(
  oneSignalId,
  title,
  message
) {
  try {
    if (!oneSignalId) return;

    await axios.post(
      "https://api.onesignal.com/notifications?c=push",
      {
        app_id: process.env.ONESIGNAL_APP_ID,

        include_subscription_ids: [
          oneSignalId,
        ],

        headings: {
          en: title,
        },

        contents: {
          en: message,
        },
      },
      {
        headers: {
          Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "Push notification sent."
    );

  } catch (err) {

    console.log(
      "Push Notification Error:"
    );

    console.log(
      err.response?.data || err.message
    );

  }
};
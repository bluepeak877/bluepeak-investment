const axios = require("axios");

module.exports = async function sendPushNotification(
  oneSignalId,
  title,
  message
) {
  try {
    if (
      !oneSignalId ||
      typeof oneSignalId !== "string" ||
      oneSignalId.trim() === ""
    ) {
      console.log("No valid OneSignal ID found.");
      return;
    }

    const response = await axios.post(
      "https://api.onesignal.com/notifications?c=push",
      {
        app_id: process.env.ONESIGNAL_APP_ID,

        include_subscription_ids: [oneSignalId],

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

    console.log("✅ Push notification sent.");
    console.log(response.data);

    return response.data;

  } catch (err) {

    console.log("❌ Push Notification Error:");

    console.log(
      err.response?.data || err.message
    );
  }
};
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

    if (
      !process.env.ONESIGNAL_APP_ID ||
      !process.env.ONESIGNAL_REST_API_KEY
    ) {
      console.log("OneSignal app ID or REST API key is missing.");
      return;
    }

    const response = await axios.post(
      "https://api.onesignal.com/notifications",
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
          Authorization: `Basic ${process.env.ONESIGNAL_REST_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Push notification sent.");
    console.log(response.data);

    return response.data;
  } catch (err) {
    console.log("Push Notification Error:");

    if (err.response) {
      console.log("Status:", err.response.status);
      console.log("Headers:", err.response.headers);
      console.log(
        "Body:",
        JSON.stringify(err.response.data, null, 2)
      );
      return err.response.data;
    }

    console.log(err.message);
    return null;
  }
};

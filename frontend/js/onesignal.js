const ONESIGNAL_API_URL =
  window.BLUEPEAK_CONFIG?.API_URL || "https://bluepeak.ng/api";
const ONESIGNAL_APP_ID =
  window.BLUEPEAK_CONFIG?.ONESIGNAL_APP_ID ||
  "b0508782-f7ca-4181-b98e-59295e34c725";

window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function (OneSignal) {
  const token = localStorage.getItem("token");

  if (!token) {
    return;
  }

  try {
    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      serviceWorkerPath: "/OneSignalSDKWorker.js",
      serviceWorkerParam: {
        scope: "/",
      },
    });

    OneSignal.User.PushSubscription.addEventListener(
      "change",
      saveCurrentSubscription
    );

    const permission =
      OneSignal.Notifications.permissionNative ||
      window.Notification?.permission;

    if (permission === "default") {
      await OneSignal.Notifications.requestPermission();
    }

    const permissionGranted =
      OneSignal.Notifications.permission === true ||
      OneSignal.Notifications.permissionNative === "granted";

    if (permissionGranted && !OneSignal.User.PushSubscription.optedIn) {
      await OneSignal.User.PushSubscription.optIn();
    }

    await saveCurrentSubscription();
  } catch (error) {
    console.log("OneSignal init error:", error);
  }

  async function saveCurrentSubscription() {
    const subscription = OneSignal.User.PushSubscription;
    const oneSignalId = subscription.id;

    if (!subscription.optedIn || !oneSignalId) {
      await disablePushSubscription();
      return;
    }

    try {
      const response = await fetch(`${ONESIGNAL_API_URL}/onesignal/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oneSignalId,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.log(
          "OneSignal save failed:",
          data.message || response.statusText
        );
      }
    } catch (error) {
      console.log("OneSignal save error:", error);
    }
  }

  async function disablePushSubscription() {
    try {
      await fetch(`${ONESIGNAL_API_URL}/onesignal/disable`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.log("OneSignal disable error:", error);
    }
  }
});

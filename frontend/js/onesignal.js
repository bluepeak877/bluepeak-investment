const API_URL = "https://bluepeak.ng/api";

window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function (OneSignal) {

  await OneSignal.init({
    appId: "b0508782-f7ca-4181-b98e-59295e34c725",
  });

  // Ask for notification permission
  await OneSignal.Notifications.requestPermission();

  // Get current subscription
  const subscription =
    OneSignal.User.PushSubscription;

  if (!subscription.optedIn) return;

  const oneSignalId = subscription.id;

  console.log("OneSignal ID:", oneSignalId);

  // User must be logged in
  const token = localStorage.getItem("token");

  if (!token) return;

  // Save to backend
  await fetch(`${API_URL}/onesignal/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      oneSignalId,
    }),
  });

});
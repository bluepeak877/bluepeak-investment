console.log("onesignal.js loaded");

window.OneSignalDeferred = window.OneSignalDeferred || [];

window.OneSignalDeferred.push(async function (OneSignal) {
  console.log("OneSignal SDK Ready");

  await OneSignal.init({
    appId: "b0508782-f7ca-4181-b98e-59295e34c725",
  });

  console.log("OneSignal initialized");

  console.log("Permission:", OneSignal.Notifications.permission);

  try {
    await OneSignal.Notifications.requestPermission();
    console.log("Permission request finished");
  } catch (err) {
    console.error("Permission error:", err);
  }
});
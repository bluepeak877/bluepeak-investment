console.log("OneSignal JS Loaded");

window.OneSignalDeferred = window.OneSignalDeferred || [];

window.OneSignalDeferred.push(async function (OneSignal) {

    console.log("OneSignal SDK Ready");

    await OneSignal.init({
        appId: "b0508782-f7ca-4181-b98e-59295e34c725"
    });

    console.log("Initialized");

    await OneSignal.Notifications.requestPermission();

    console.log("Permission Requested");

});
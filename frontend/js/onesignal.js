window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function (OneSignal) {

    await OneSignal.init({
        appId: "b0508782-f7ca-4181-b98e-59295e34c725",
    });

    // Show native browser permission prompt
    await OneSignal.Notifications.requestPermission();

});
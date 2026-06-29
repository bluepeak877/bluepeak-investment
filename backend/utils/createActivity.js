const Activity = require("../models/Activity");

function shortName(fullName) {
  const trimmedName = String(fullName || "").trim();
  const firstName = trimmedName ? trimmedName.split(" ")[0] : "User";

  if (firstName.length <= 6) {
    return firstName;
  }

  const start = firstName.slice(0, 4);
  const end = firstName.slice(-2);

  return `${start}****${end}`;
}

module.exports = async (
  user,
  type,
  message,
  amount = 0
) => {
  try {
    if (!user || !user._id) {
      return;
    }

    const displayName = shortName(user.fullName);
    const messageText = String(message || "");
    const activityMessage = user.fullName
      ? messageText.replace(user.fullName, displayName)
      : messageText;

    await Activity.create({
      user: user._id,
      name: displayName,
      type,
      message: activityMessage,
      amount,
    });

  } catch (err) {
    console.log("Activity Error:", err.message);
  }
};

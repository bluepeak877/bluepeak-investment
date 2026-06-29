const Activity = require("../models/Activity");

function shortName(fullName) {
  const parts = fullName.trim().split(" ");

  if (parts.length > 1) {
    return `${parts[0]} ${parts[1][0]}.`;
  }

  return parts[0];
}

module.exports = async (
  user,
  type,
  message,
  amount = 0
) => {
  try {

    const displayName = shortName(user.fullName);

    await Activity.create({
      user: user._id,
      name: displayName,
      type,

      // Replace full name with short name
      message: message.replace(user.fullName, displayName),

      amount,
    });

  } catch (err) {

    console.log("Activity Error:", err.message);

  }
};
const Activity = require("../models/Activity");

function shortName(fullName) {
  const firstName = fullName.trim().split(" ")[0];

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
    const displayName = shortName(user.fullName);

    await Activity.create({
      user: user._id,
      name: displayName,
      type,
      message: message.replace(user.fullName, displayName),
      amount,
    });

  } catch (err) {
    console.log("Activity Error:", err.message);
  }
};
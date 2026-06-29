const Activity = require("../models/Activity");

exports.getActivities = async (req, res) => {
  try {

    const activities = await Activity
      .find()
      .sort({ createdAt: -1 })
      .limit(30);

    res.json(activities);

  } catch (err) {

    res.status(500).json({
      message: "Server Error",
    });

  }
};
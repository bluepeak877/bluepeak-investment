const Activity = require("../models/Activity");

exports.getActivities = async (req, res) => {
  try {

    const activities = await Activity
      .find()
      .select("name type message amount createdAt")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json(activities);

  } catch (err) {

    res.status(500).json({
      message: "Server Error",
    });

  }
};

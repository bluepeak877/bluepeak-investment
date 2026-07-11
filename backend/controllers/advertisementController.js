const Advertisement = require("../models/Advertisement");
const fs = require("fs");
const path = require("path");

const advertisementUploadDir = path.resolve(__dirname, "../uploads/advertisements");

function toBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}

function cleanAdvertisementPayload(body, current = {}) {
  return {
    title: body.title ?? current.title,
    description: body.description ?? current.description,
    buttonText: body.buttonText || current.buttonText || "Learn More",
    linkType: body.linkType || current.linkType || "packages",
    linkValue: body.linkValue ?? current.linkValue ?? "",
    placement: body.placement || current.placement || "dashboard",
    displayOrder: Number(body.displayOrder || current.displayOrder || 1),
    isActive: toBoolean(body.isActive, current.isActive ?? true),
    startDate: body.startDate || current.startDate || Date.now(),
    endDate: body.endDate === "" ? undefined : body.endDate ?? current.endDate,
  };
}

function deleteAdvertisementImage(imagePath) {
  if (!imagePath || !imagePath.startsWith("/uploads/advertisements/")) return;

  const filePath = path.resolve(
    advertisementUploadDir,
    path.basename(imagePath)
  );

  if (!filePath.startsWith(advertisementUploadDir)) return;

  fs.promises.unlink(filePath).catch((error) => {
    if (error.code !== "ENOENT") {
      console.error("Delete Advertisement Image Error:", error);
    }
  });
}

/**
 * Create Advertisement
 */
exports.createAdvertisement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Advertisement image is required.",
      });
    }

    const advertisement = await Advertisement.create({
      ...cleanAdvertisementPayload(req.body),
      image: `/uploads/advertisements/${req.file.filename}`,
    });

    res.status(201).json({
      success: true,
      message: "Advertisement created successfully.",
      advertisement,
    });
  } catch (error) {
    console.error("Create Advertisement Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.getAdvertisements = async (req, res) => {
  try {
    const advertisements = await Advertisement.find().sort({
      displayOrder: 1,
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: advertisements.length,
      advertisements,
    });
  } catch (error) {
    console.error("Get Advertisements Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * Get Active Advertisements
 */
exports.getActiveAdvertisements = async (req, res) => {
  try {
    const today = new Date();
    const placement = req.query.placement;
    const placementFilter = placement
      ? [
          {
            $or: [
              { placement },
              { placement: "all" },
            ],
          },
        ]
      : [];

    const advertisements = await Advertisement.find({
      $and: [
        ...placementFilter,
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: today } },
          ],
        },
      ],
      isActive: true,
      startDate: { $lte: today },
    }).sort({
      displayOrder: 1,
    });

    res.status(200).json({
      success: true,
      advertisements,
    });
  } catch (error) {
    console.error("Get Active Advertisements Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.trackAdvertisementClick = async (req, res) => {
  try {
    await Advertisement.findByIdAndUpdate(req.params.id, {
      $inc: { clicks: 1 },
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Track Advertisement Click Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.trackAdvertisementView = async (req, res) => {
  try {
    await Advertisement.findByIdAndUpdate(req.params.id, {
      $inc: { views: 1 },
    });

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Track Advertisement View Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * Update Advertisement
 */
exports.updateAdvertisement = async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    Object.assign(advertisement, cleanAdvertisementPayload(req.body, advertisement));

    const oldImage = advertisement.image;

    // Update image only if a new one is uploaded
    if (req.file) {
      advertisement.image = `/uploads/advertisements/${req.file.filename}`;
    }

    await advertisement.save();

    if (req.file) {
      deleteAdvertisementImage(oldImage);
    }

    res.json({
      success: true,
      message: "Advertisement updated successfully.",
      advertisement,
    });
  } catch (error) {
    console.error("Update Advertisement Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

/**
 * Delete Advertisement
 */
exports.deleteAdvertisement = async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: "Advertisement not found",
      });
    }

    const imagePath = advertisement.image;

    await advertisement.deleteOne();
    deleteAdvertisementImage(imagePath);

    res.json({
      success: true,
      message: "Advertisement deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Advertisement Error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

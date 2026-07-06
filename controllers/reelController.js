const asyncHandler = require("express-async-handler");
const Reel = require("../models/Reel");
const User = require("../models/User");
const Notification = require("../models/Notification");
const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "vibely/reels", resource_type: "video" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
};

// @desc    Upload a new reel
// @route   POST /api/reels   (multipart: video + caption)
// @access  Private
const createReel = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Video file is required for a reel");
  }

  if (!req.file.mimetype.startsWith("video")) {
    res.status(400);
    throw new Error("Reels only support video files");
  }

  const uploadResult = await uploadToCloudinary(req.file.buffer);

  const reel = await Reel.create({
    user: req.user._id,
    caption: req.body.caption || "",
    videoUrl: uploadResult.secure_url,
    thumbnailUrl: uploadResult.secure_url.replace(/\.[^/.]+$/, ".jpg"), // cloudinary auto thumbnail
    audioName: req.body.audioName || "Original audio",
  });

  const populatedReel = await Reel.findById(reel._id).populate(
    "user",
    "username fullName profilePic"
  );

  res.status(201).json({ success: true, reel: populatedReel });
});

// @desc    Get reels feed (all recent reels, discovery style)
// @route   GET /api/reels/feed
// @access  Private
const getReelsFeed = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const reels = await Reel.find({})
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "username fullName profilePic");

  const result = reels.map((r) => ({
    ...r.toObject(),
    isLiked: r.likedBy.some((id) => id.toString() === req.user._id.toString()),
    likedBy: undefined, // don't leak full list to client
  }));

  res.json({ success: true, reels: result, page });
});

// @desc    Get single reel by id
// @route   GET /api/reels/:id
// @access  Private
const getReelById = asyncHandler(async (req, res) => {
  const reel = await Reel.findById(req.params.id).populate(
    "user",
    "username fullName profilePic"
  );

  if (!reel) {
    res.status(404);
    throw new Error("Reel not found");
  }

  res.json({ success: true, reel });
});

// @desc    Get all reels by a specific user
// @route   GET /api/reels/user/:userId
// @access  Private
const getUserReels = asyncHandler(async (req, res) => {
  const reels = await Reel.find({ user: req.params.userId }).sort({ createdAt: -1 });
  res.json({ success: true, reels });
});

// @desc    Increment view count on a reel
// @route   POST /api/reels/:id/view
// @access  Private
const viewReel = asyncHandler(async (req, res) => {
  const reel = await Reel.findByIdAndUpdate(
    req.params.id,
    { $inc: { viewsCount: 1 } },
    { new: true }
  );

  if (!reel) {
    res.status(404);
    throw new Error("Reel not found");
  }

  res.json({ success: true, viewsCount: reel.viewsCount });
});

// @desc    Like or Unlike a reel (toggle)
// @route   POST /api/reels/:id/like
// @access  Private
const toggleReelLike = asyncHandler(async (req, res) => {
  const reel = await Reel.findById(req.params.id);
  if (!reel) {
    res.status(404);
    throw new Error("Reel not found");
  }

  const userId = req.user._id;
  const alreadyLiked = reel.likedBy.some((id) => id.toString() === userId.toString());

  if (alreadyLiked) {
    reel.likedBy = reel.likedBy.filter((id) => id.toString() !== userId.toString());
    reel.likesCount = Math.max(0, reel.likesCount - 1);
    await reel.save();
    return res.json({ success: true, liked: false, likesCount: reel.likesCount });
  }

  reel.likedBy.push(userId);
  reel.likesCount += 1;
  await reel.save();

  if (reel.user.toString() !== userId.toString()) {
    const notif = await Notification.create({
      recipient: reel.user,
      sender: userId,
      type: "like",
    });
    const io = req.app.get("io");
    if (io) io.to(reel.user.toString()).emit("newNotification", notif);
  }

  res.json({ success: true, liked: true, likesCount: reel.likesCount });
});

// @desc    Delete own reel
// @route   DELETE /api/reels/:id
// @access  Private
const deleteReel = asyncHandler(async (req, res) => {
  const reel = await Reel.findById(req.params.id);
  if (!reel) {
    res.status(404);
    throw new Error("Reel not found");
  }

  if (reel.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this reel");
  }

  await reel.deleteOne();
  res.json({ success: true, message: "Reel deleted" });
});

module.exports = {
  createReel,
  getReelsFeed,
  getReelById,
  getUserReels,
  viewReel,
  toggleReelLike,
  deleteReel,
};

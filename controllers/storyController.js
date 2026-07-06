const asyncHandler = require("express-async-handler");
const Story = require("../models/Story");
const Follow = require("../models/Follow");
const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (buffer, resourceType = "image") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "vibely/stories", resource_type: resourceType },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
};

// @desc    Create a new story (24hr auto-expire)
// @route   POST /api/stories
// @access  Private
const createStory = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Media file is required for story");
  }

  const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
  const uploadResult = await uploadToCloudinary(
    req.file.buffer,
    mediaType === "video" ? "video" : "image"
  );

  const story = await Story.create({
    user: req.user._id,
    mediaUrl: uploadResult.secure_url,
    mediaType,
  });

  res.status(201).json({ success: true, story });
});

// @desc    Get stories feed (from people I follow, grouped by user)
// @route   GET /api/stories/feed
// @access  Private
const getStoriesFeed = asyncHandler(async (req, res) => {
  const following = await Follow.find({ follower: req.user._id }).select("following");
  const followingIds = following.map((f) => f.following);
  followingIds.push(req.user._id);

  const stories = await Story.find({ user: { $in: followingIds } })
    .sort({ createdAt: -1 })
    .populate("user", "username fullName profilePic");

  // group stories by user
  const grouped = {};
  stories.forEach((s) => {
    const uid = s.user._id.toString();
    if (!grouped[uid]) {
      grouped[uid] = { user: s.user, stories: [] };
    }
    grouped[uid].stories.push(s);
  });

  res.json({ success: true, storyGroups: Object.values(grouped) });
});

// @desc    Mark a story as viewed
// @route   POST /api/stories/:id/view
// @access  Private
const viewStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) {
    res.status(404);
    throw new Error("Story not found or expired");
  }

  if (!story.viewers.includes(req.user._id)) {
    story.viewers.push(req.user._id);
    await story.save();
  }

  res.json({ success: true, viewersCount: story.viewers.length });
});

// @desc    Delete own story
// @route   DELETE /api/stories/:id
// @access  Private
const deleteStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);
  if (!story) {
    res.status(404);
    throw new Error("Story not found");
  }

  if (story.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this story");
  }

  await story.deleteOne();
  res.json({ success: true, message: "Story deleted" });
});

module.exports = { createStory, getStoriesFeed, viewStory, deleteStory };

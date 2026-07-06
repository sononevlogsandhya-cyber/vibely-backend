const asyncHandler = require("express-async-handler");
const Follow = require("../models/Follow");
const User = require("../models/User");
const Notification = require("../models/Notification");

// @desc    Follow or Unfollow a user (toggle)
// @route   POST /api/users/:id/follow
// @access  Private
const toggleFollow = asyncHandler(async (req, res) => {
  const targetUserId = req.params.id;
  const myId = req.user._id;

  if (targetUserId === myId.toString()) {
    res.status(400);
    throw new Error("You cannot follow yourself");
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const existingFollow = await Follow.findOne({
    follower: myId,
    following: targetUserId,
  });

  if (existingFollow) {
    // Unfollow
    await existingFollow.deleteOne();
    await User.findByIdAndUpdate(myId, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: -1 } });

    return res.json({ success: true, following: false });
  }

  // Follow
  await Follow.create({ follower: myId, following: targetUserId });
  await User.findByIdAndUpdate(myId, { $inc: { followingCount: 1 } });
  await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } });

  const notif = await Notification.create({
    recipient: targetUserId,
    sender: myId,
    type: "follow",
  });

  const io = req.app.get("io");
  if (io) io.to(targetUserId.toString()).emit("newNotification", notif);

  res.json({ success: true, following: true });
});

// @desc    Get followers list of a user
// @route   GET /api/users/:id/followers
// @access  Private
const getFollowers = asyncHandler(async (req, res) => {
  const followers = await Follow.find({ following: req.params.id }).populate(
    "follower",
    "username fullName profilePic"
  );
  res.json({ success: true, users: followers.map((f) => f.follower) });
});

// @desc    Get following list of a user
// @route   GET /api/users/:id/following
// @access  Private
const getFollowing = asyncHandler(async (req, res) => {
  const following = await Follow.find({ follower: req.params.id }).populate(
    "following",
    "username fullName profilePic"
  );
  res.json({ success: true, users: following.map((f) => f.following) });
});

module.exports = { toggleFollow, getFollowers, getFollowing };

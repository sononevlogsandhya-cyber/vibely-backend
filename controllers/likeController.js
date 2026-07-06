const asyncHandler = require("express-async-handler");
const Like = require("../models/Like");
const Post = require("../models/Post");
const Notification = require("../models/Notification");

// @desc    Like or Unlike a post (toggle)
// @route   POST /api/posts/:id/like
// @access  Private
const toggleLike = asyncHandler(async (req, res) => {
  const postId = req.params.id;
  const userId = req.user._id;

  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const existingLike = await Like.findOne({ post: postId, user: userId });

  if (existingLike) {
    // Unlike
    await existingLike.deleteOne();
    post.likesCount = Math.max(0, post.likesCount - 1);
    await post.save();

    return res.json({ success: true, liked: false, likesCount: post.likesCount });
  }

  // Like
  await Like.create({ post: postId, user: userId });
  post.likesCount += 1;
  await post.save();

  // Create notification (skip if liking own post)
  if (post.user.toString() !== userId.toString()) {
    const notif = await Notification.create({
      recipient: post.user,
      sender: userId,
      type: "like",
      post: postId,
    });

    // emit real-time notification if socket.io is set up
    const io = req.app.get("io");
    if (io) {
      io.to(post.user.toString()).emit("newNotification", notif);
    }
  }

  res.json({ success: true, liked: true, likesCount: post.likesCount });
});

// @desc    Get list of users who liked a post
// @route   GET /api/posts/:id/likes
// @access  Private
const getPostLikes = asyncHandler(async (req, res) => {
  const likes = await Like.find({ post: req.params.id }).populate(
    "user",
    "username fullName profilePic"
  );

  res.json({ success: true, users: likes.map((l) => l.user) });
});

module.exports = { toggleLike, getPostLikes };

const asyncHandler = require("express-async-handler");
const Post = require("../models/Post");
const User = require("../models/User");
const Follow = require("../models/Follow");
const Like = require("../models/Like");
const cloudinary = require("../config/cloudinary");

// Helper: upload buffer to cloudinary
const uploadToCloudinary = (buffer, resourceType = "image") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "vibely/posts", resource_type: resourceType },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
};

// @desc    Create a new post
// @route   POST /api/posts   (multipart: image + caption)
// @access  Private
const createPost = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Media file (image/video) is required");
  }

  const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
  const uploadResult = await uploadToCloudinary(
    req.file.buffer,
    mediaType === "video" ? "video" : "image"
  );

  const post = await Post.create({
    user: req.user._id,
    caption: req.body.caption || "",
    mediaUrl: uploadResult.secure_url,
    mediaType,
    location: req.body.location || "",
  });

  await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: 1 } });

  const populatedPost = await Post.findById(post._id).populate(
    "user",
    "username fullName profilePic"
  );

  res.status(201).json({ success: true, post: populatedPost });
});

// @desc    Get home feed (posts of people I follow + my own)
// @route   GET /api/posts/feed
// @access  Private
const getFeed = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const following = await Follow.find({ follower: req.user._id }).select("following");
  const followingIds = following.map((f) => f.following);
  followingIds.push(req.user._id); // include own posts

  const posts = await Post.find({ user: { $in: followingIds } })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "username fullName profilePic");

  // attach isLiked flag for the requesting user
  const postIds = posts.map((p) => p._id);
  const myLikes = await Like.find({ post: { $in: postIds }, user: req.user._id }).select("post");
  const likedSet = new Set(myLikes.map((l) => l.post.toString()));

  const result = posts.map((p) => ({
    ...p.toObject(),
    isLiked: likedSet.has(p._id.toString()),
  }));

  res.json({ success: true, posts: result, page });
});

// @desc    Get explore feed (all recent posts, discovery grid)
// @route   GET /api/posts/explore
// @access  Private
const getExplore = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;

  const posts = await Post.find({})
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("user", "username fullName profilePic");

  res.json({ success: true, posts, page });
});

// @desc    Get single post by id
// @route   GET /api/posts/:id
// @access  Private
const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate(
    "user",
    "username fullName profilePic"
  );

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  res.json({ success: true, post });
});

// @desc    Get all posts by a specific user (for profile grid)
// @route   GET /api/posts/user/:userId
// @access  Private
const getUserPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find({ user: req.params.userId }).sort({ createdAt: -1 });
  res.json({ success: true, posts });
});

// @desc    Delete a post (only owner)
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (post.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to delete this post");
  }

  await post.deleteOne();
  await User.findByIdAndUpdate(req.user._id, { $inc: { postsCount: -1 } });

  res.json({ success: true, message: "Post deleted" });
});

module.exports = {
  createPost,
  getFeed,
  getExplore,
  getPostById,
  getUserPosts,
  deletePost,
};

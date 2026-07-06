const asyncHandler = require("express-async-handler");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const Notification = require("../models/Notification");
const { checkComment } = require("../utils/commentFilter");

// @desc    Add a comment to a post
// @route   POST /api/posts/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const postId = req.params.id;

  if (!text || !text.trim()) {
    res.status(400);
    throw new Error("Comment text is required");
  }

  const filterResult = checkComment(text);
  if (filterResult.blocked) {
    res.status(400);
    throw new Error(filterResult.reason);
  }

  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const comment = await Comment.create({
    post: postId,
    user: req.user._id,
    text: text.trim(),
  });

  post.commentsCount += 1;
  await post.save();

  if (post.user.toString() !== req.user._id.toString()) {
    const notif = await Notification.create({
      recipient: post.user,
      sender: req.user._id,
      type: "comment",
      post: postId,
      text: text.trim().slice(0, 100),
    });

    const io = req.app.get("io");
    if (io) io.to(post.user.toString()).emit("newNotification", notif);
  }

  const populatedComment = await Comment.findById(comment._id).populate(
    "user",
    "username fullName profilePic"
  );

  res.status(201).json({ success: true, comment: populatedComment });
});

// @desc    Get all comments on a post
// @route   GET /api/posts/:id/comments
// @access  Private
const getComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ post: req.params.id })
    .sort({ createdAt: -1 })
    .populate("user", "username fullName profilePic");

  res.json({ success: true, comments });
});

// @desc    Edit own comment
// @route   PUT /api/comments/:id
// @access  Private
const editComment = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    res.status(400);
    throw new Error("Comment text is required");
  }

  const filterResult = checkComment(text);
  if (filterResult.blocked) {
    res.status(400);
    throw new Error(filterResult.reason);
  }

  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }

  if (comment.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to edit this comment");
  }

  comment.text = text.trim();
  comment.edited = true;
  await comment.save();

  const populatedComment = await Comment.findById(comment._id).populate(
    "user",
    "username fullName profilePic"
  );

  res.json({ success: true, comment: populatedComment });
});

// @desc    Delete a comment (owner of comment or post owner)
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }

  const post = await Post.findById(comment.post);

  const isCommentOwner = comment.user.toString() === req.user._id.toString();
  const isPostOwner = post && post.user.toString() === req.user._id.toString();

  if (!isCommentOwner && !isPostOwner) {
    res.status(403);
    throw new Error("Not authorized to delete this comment");
  }

  await comment.deleteOne();

  if (post) {
    post.commentsCount = Math.max(0, post.commentsCount - 1);
    await post.save();
  }

  res.json({ success: true, message: "Comment deleted" });
});

module.exports = { addComment, getComments, editComment, deleteComment };

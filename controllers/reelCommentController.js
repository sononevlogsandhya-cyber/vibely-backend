const asyncHandler = require("express-async-handler");
const ReelComment = require("../models/ReelComment");
const Reel = require("../models/Reel");
const Notification = require("../models/Notification");
const { checkComment } = require("../utils/commentFilter");

// @desc    Add a comment to a reel
// @route   POST /api/reels/:id/comments
// @access  Private
const addReelComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const reelId = req.params.id;

  if (!text || !text.trim()) {
    res.status(400);
    throw new Error("Comment text is required");
  }

  const filterResult = checkComment(text);
  if (filterResult.blocked) {
    res.status(400);
    throw new Error(filterResult.reason);
  }

  const reel = await Reel.findById(reelId);
  if (!reel) {
    res.status(404);
    throw new Error("Reel not found");
  }

  const comment = await ReelComment.create({
    reel: reelId,
    user: req.user._id,
    text: text.trim(),
  });

  reel.commentsCount += 1;
  await reel.save();

  if (reel.user.toString() !== req.user._id.toString()) {
    const notif = await Notification.create({
      recipient: reel.user,
      sender: req.user._id,
      type: "comment",
      text: text.trim().slice(0, 100),
    });
    const io = req.app.get("io");
    if (io) io.to(reel.user.toString()).emit("newNotification", notif);
  }

  const populatedComment = await ReelComment.findById(comment._id).populate(
    "user",
    "username fullName profilePic"
  );

  res.status(201).json({ success: true, comment: populatedComment });
});

// @desc    Get all comments on a reel
// @route   GET /api/reels/:id/comments
// @access  Private
const getReelComments = asyncHandler(async (req, res) => {
  const comments = await ReelComment.find({ reel: req.params.id })
    .sort({ createdAt: -1 })
    .populate("user", "username fullName profilePic");

  res.json({ success: true, comments });
});

// @desc    Edit own reel comment
// @route   PUT /api/reels/comments/:id
// @access  Private
const editReelComment = asyncHandler(async (req, res) => {
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

  const comment = await ReelComment.findById(req.params.id);
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

  res.json({ success: true, comment });
});

// @desc    Delete a reel comment (owner of comment or reel owner)
// @route   DELETE /api/reels/comments/:id
// @access  Private
const deleteReelComment = asyncHandler(async (req, res) => {
  const comment = await ReelComment.findById(req.params.id);
  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }

  const reel = await Reel.findById(comment.reel);

  const isCommentOwner = comment.user.toString() === req.user._id.toString();
  const isReelOwner = reel && reel.user.toString() === req.user._id.toString();

  if (!isCommentOwner && !isReelOwner) {
    res.status(403);
    throw new Error("Not authorized to delete this comment");
  }

  await comment.deleteOne();

  if (reel) {
    reel.commentsCount = Math.max(0, reel.commentsCount - 1);
    await reel.save();
  }

  res.json({ success: true, message: "Comment deleted" });
});

module.exports = {
  addReelComment,
  getReelComments,
  editReelComment,
  deleteReelComment,
};

const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");

// @desc    Get all notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .populate("sender", "username fullName profilePic")
    .populate("post", "mediaUrl")
    .limit(50);

  res.json({ success: true, notifications });
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findById(req.params.id);

  if (!notif) {
    res.status(404);
    throw new Error("Notification not found");
  }

  if (notif.recipient.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized");
  }

  notif.isRead = true;
  await notif.save();

  res.json({ success: true, notification: notif });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.json({ success: true, message: "All notifications marked as read" });
});

module.exports = { getNotifications, markAsRead, markAllAsRead };

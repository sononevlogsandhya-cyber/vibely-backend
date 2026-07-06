const asyncHandler = require("express-async-handler");
const Message = require("../models/Message");
const User = require("../models/User");

// @desc    Send a direct message
// @route   POST /api/chat/:userId
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const receiverId = req.params.userId;

  if (!text || !text.trim()) {
    res.status(400);
    throw new Error("Message text is required");
  }

  const receiver = await User.findById(receiverId);
  if (!receiver) {
    res.status(404);
    throw new Error("Receiver not found");
  }

  const message = await Message.create({
    sender: req.user._id,
    receiver: receiverId,
    text: text.trim(),
  });

  // emit real-time message via socket.io
  const io = req.app.get("io");
  if (io) {
    io.to(receiverId.toString()).emit("newMessage", message);
  }

  res.status(201).json({ success: true, message });
});

// @desc    Get full conversation with a specific user
// @route   GET /api/chat/:userId
// @access  Private
const getConversation = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;
  const myId = req.user._id;

  const messages = await Message.find({
    $or: [
      { sender: myId, receiver: otherUserId },
      { sender: otherUserId, receiver: myId },
    ],
  }).sort({ createdAt: 1 });

  // mark messages from other user as read
  await Message.updateMany(
    { sender: otherUserId, receiver: myId, isRead: false },
    { $set: { isRead: true } }
  );

  res.json({ success: true, messages });
});

// @desc    Get list of conversations (inbox - last message per user)
// @route   GET /api/chat
// @access  Private
const getInbox = asyncHandler(async (req, res) => {
  const myId = req.user._id;

  const messages = await Message.find({
    $or: [{ sender: myId }, { receiver: myId }],
  }).sort({ createdAt: -1 });

  const conversationsMap = {};
  messages.forEach((msg) => {
    const otherUserId =
      msg.sender.toString() === myId.toString() ? msg.receiver.toString() : msg.sender.toString();

    if (!conversationsMap[otherUserId]) {
      conversationsMap[otherUserId] = msg;
    }
  });

  const otherUserIds = Object.keys(conversationsMap);
  const users = await User.find({ _id: { $in: otherUserIds } }).select(
    "username fullName profilePic"
  );

  const inbox = users.map((u) => ({
    user: u,
    lastMessage: conversationsMap[u._id.toString()],
  }));

  res.json({ success: true, inbox });
});

module.exports = { sendMessage, getConversation, getInbox };

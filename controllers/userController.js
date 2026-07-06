const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Follow = require("../models/Follow");
const cloudinary = require("../config/cloudinary");

// @desc    Get user profile by id or username
// @route   GET /api/users/:id
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const identifier = req.params.id;

  const user = await User.findOne({
    $or: [{ _id: identifier.match(/^[0-9a-fA-F]{24}$/) ? identifier : null }, { username: identifier.toLowerCase() }],
  }).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isFollowing = await Follow.findOne({
    follower: req.user._id,
    following: user._id,
  });

  res.json({ success: true, user, isFollowing: !!isFollowing });
});

// @desc    Update own profile (bio, fullName, profilePic)
// @route   PUT /api/users/me
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.fullName = req.body.fullName || user.fullName;
  user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
  user.isPrivate = req.body.isPrivate !== undefined ? req.body.isPrivate : user.isPrivate;

  // Optional profile picture upload
  if (req.file) {
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "vibely/profile_pics" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(req.file.buffer);
    });
    user.profilePic = uploadResult.secure_url;
  }

  const updatedUser = await user.save();

  res.json({
    success: true,
    user: {
      id: updatedUser._id,
      username: updatedUser.username,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      profilePic: updatedUser.profilePic,
      bio: updatedUser.bio,
      isPrivate: updatedUser.isPrivate,
    },
  });
});

// @desc    Search users by username/fullName
// @route   GET /api/users/search?q=xyz
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
  const q = req.query.q || "";

  const users = await User.find({
    $or: [
      { username: { $regex: q, $options: "i" } },
      { fullName: { $regex: q, $options: "i" } },
    ],
  })
    .select("username fullName profilePic isVerified")
    .limit(20);

  res.json({ success: true, users });
});

module.exports = { getUserProfile, updateProfile, searchUsers };

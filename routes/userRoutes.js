const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const { getMe } = require("../controllers/authController");
const {
  getUserProfile,
  updateProfile,
  searchUsers,
} = require("../controllers/userController");
const {
  toggleFollow,
  getFollowers,
  getFollowing,
} = require("../controllers/followController");

router.get("/me", protect, getMe);
router.put("/me", protect, upload.single("profilePic"), updateProfile);
router.get("/search", protect, searchUsers);

router.get("/:id", protect, getUserProfile);
router.post("/:id/follow", protect, toggleFollow);
router.get("/:id/followers", protect, getFollowers);
router.get("/:id/following", protect, getFollowing);

module.exports = router;

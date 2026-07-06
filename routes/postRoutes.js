const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  createPost,
  getFeed,
  getExplore,
  getPostById,
  getUserPosts,
  deletePost,
} = require("../controllers/postController");

const { toggleLike, getPostLikes } = require("../controllers/likeController");
const { addComment, getComments } = require("../controllers/commentController");

// Feed & Explore (must be before /:id)
router.get("/feed", protect, getFeed);
router.get("/explore", protect, getExplore);
router.get("/user/:userId", protect, getUserPosts);

// Create post
router.post("/", protect, upload.single("image"), createPost);

// Single post
router.get("/:id", protect, getPostById);
router.delete("/:id", protect, deletePost);

// Like
router.post("/:id/like", protect, toggleLike);
router.get("/:id/likes", protect, getPostLikes);

// Comments
router.post("/:id/comments", protect, addComment);
router.get("/:id/comments", protect, getComments);

module.exports = router;

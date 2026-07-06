const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  createReel,
  getReelsFeed,
  getReelById,
  getUserReels,
  viewReel,
  toggleReelLike,
  deleteReel,
} = require("../controllers/reelController");

const {
  addReelComment,
  getReelComments,
  editReelComment,
  deleteReelComment,
} = require("../controllers/reelCommentController");

// Feed (must be before /:id)
router.get("/feed", protect, getReelsFeed);
router.get("/user/:userId", protect, getUserReels);

// Comment edit/delete by comment id (must be before /:id routes below to avoid clash)
router.put("/comments/:id", protect, editReelComment);
router.delete("/comments/:id", protect, deleteReelComment);

// Create reel
router.post("/", protect, upload.single("video"), createReel);

// Single reel
router.get("/:id", protect, getReelById);
router.delete("/:id", protect, deleteReel);
router.post("/:id/view", protect, viewReel);
router.post("/:id/like", protect, toggleReelLike);

// Comments on a reel
router.post("/:id/comments", protect, addReelComment);
router.get("/:id/comments", protect, getReelComments);

module.exports = router;

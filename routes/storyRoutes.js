const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  createStory,
  getStoriesFeed,
  viewStory,
  deleteStory,
} = require("../controllers/storyController");

router.get("/feed", protect, getStoriesFeed);
router.post("/", protect, upload.single("media"), createStory);
router.post("/:id/view", protect, viewStory);
router.delete("/:id", protect, deleteStory);

module.exports = router;

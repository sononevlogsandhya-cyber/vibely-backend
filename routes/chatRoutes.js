const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  sendMessage,
  getConversation,
  getInbox,
} = require("../controllers/chatController");

router.get("/", protect, getInbox);
router.get("/:userId", protect, getConversation);
router.post("/:userId", protect, sendMessage);

module.exports = router;

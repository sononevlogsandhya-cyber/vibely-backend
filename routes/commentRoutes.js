const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { editComment, deleteComment } = require("../controllers/commentController");

router.put("/:id", protect, editComment);
router.delete("/:id", protect, deleteComment);

module.exports = router;

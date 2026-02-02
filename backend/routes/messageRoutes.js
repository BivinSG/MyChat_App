const express = require("express");
const {
  allMessages,
  sendMessage,
  clearMessages,
  deleteSingleMessage,
  markAsRead,
} = require("../controllers/messageControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/single/:messageId").delete(protect, deleteSingleMessage);
router.route("/read/:chatId").put(protect, markAsRead);
router.route("/:chatId").get(protect, allMessages).delete(protect, clearMessages);
router.route("/").post(protect, sendMessage);

module.exports = router;

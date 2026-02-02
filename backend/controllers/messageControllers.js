const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
    readBy: [req.user._id],
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic").execPopulate();
    message = await message.populate("chat").execPopulate();
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});
//@description     Clear all Messages in a Chat
//@route           DELETE /api/Message/:chatId
//@access          Protected
const clearMessages = asyncHandler(async (req, res) => {
  try {
    await Message.deleteMany({ chat: req.params.chatId });

    // Also clear the latestMessage reference in the chat
    await Chat.findByIdAndUpdate(req.params.chatId, { latestMessage: null });

    res.json({ message: "Messages cleared successfully" });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Delete a Single Message
//@route           DELETE /api/Message/single/:messageId
//@access          Protected
const deleteSingleMessage = asyncHandler(async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId).populate("chat");

    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    // Check if the user is part of the chat where the message belongs
    const isUserInChat = message.chat.users.some(
      (userId) => userId.toString() === req.user._id.toString()
    );

    if (!isUserInChat) {
      res.status(401);
      throw new Error("User not authorized to delete this message");
    }

    await Message.findByIdAndDelete(req.params.messageId);

    // If this was the latest message, we might want to update the chat's latestMessage
    // But for simplicity in this MVP, we'll just check if it was and null it if so.
    // A more complex implementation would find the next latest message.
    if (message.chat.latestMessage && message.chat.latestMessage.toString() === message._id.toString()) {
      await Chat.findByIdAndUpdate(message.chat._id, { latestMessage: null });
    }

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Mark all Messages as Read
//@route           PUT /api/Message/read/:chatId
//@access          Protected
const markAsRead = asyncHandler(async (req, res) => {
  try {
    await Message.updateMany(
      { chat: req.params.chatId, readBy: { $ne: req.user._id } },
      { $push: { readBy: req.user._id } }
    );
    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { allMessages, sendMessage, clearMessages, deleteSingleMessage, markAsRead };

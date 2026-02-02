const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    console.log("UserId param not sent with request");
    return res.sendStatus(400);
  }

  var isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: req.user._id } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate("latestMessage");

  isChat = await User.populate(isChat, {
    path: "latestMessage.sender",
    select: "name pic email",
  });

  if (isChat.length > 0) {
    // Unhide the chat for the current user if it was hidden
    await Chat.findByIdAndUpdate(isChat[0]._id, {
      $pull: { hiddenFor: req.user._id }
    });
    res.send(isChat[0]);
  } else {
    var chatData = {
      chatName: "sender",
      isGroupChat: false,
      users: [req.user._id, userId],
      hiddenFor: [], // Initialize empty hiddenFor array
    };

    try {
      const createdChat = await Chat.create(chatData);
      const FullChat = await Chat.findOne({ _id: createdChat._id }).populate(
        "users",
        "-password"
      );
      res.status(200).json(FullChat);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }
});

//@description     Fetch all chats for a user
//@route           GET /api/chat/
//@access          Protected
const fetchChats = asyncHandler(async (req, res) => {
  try {
    Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
      // Exclude chats hidden by this user
      hiddenFor: { $ne: req.user._id }
    })
      .populate("users", "-password")
      .populate("groupAdmin", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 })
      .then(async (results) => {
        results = await User.populate(results, {
          path: "latestMessage.sender",
          select: "name pic email",
        });
        res.status(200).send(results);
      });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Group Chat
//@route           POST /api/chat/group
//@access          Protected
const createGroupChat = asyncHandler(async (req, res) => {
  if (!req.body.users || !req.body.name) {
    return res.status(400).send({ message: "Please Fill all the feilds" });
  }

  var users = req.body.users;
  if (typeof users === "string") {
    try {
      users = JSON.parse(users);
    } catch (e) {
      return res.status(400).send({ message: "Invalid users format" });
    }
  }

  if (users.length < 2) {
    return res
      .status(400)
      .send("More than 2 users are required to form a group chat");
  }

  users.push(req.user);

  try {
    const groupChat = await Chat.create({
      chatName: req.body.name,
      users: users,
      isGroupChat: true,
      groupAdmin: req.user,
    });

    const fullGroupChat = await Chat.findOne({ _id: groupChat._id })
      .populate("users", "-password")
      .populate("groupAdmin", "-password");

    res.status(200).json(fullGroupChat);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Rename Group
// @route   PUT /api/chat/rename
// @access  Protected
const renameGroup = asyncHandler(async (req, res) => {
  const { chatId, chatName } = req.body;

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    {
      chatName: chatName,
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updatedChat) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(updatedChat);
  }
});

// @desc    Remove user from Group
// @route   PUT /api/chat/groupremove
// @access  Protected
const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // First, get the chat to check admin status
  const chat = await Chat.findById(chatId);

  if (!chat) {
    res.status(404);
    throw new Error("Chat Not Found");
  }

  // Prevent admin from removing themselves while other members exist
  if (chat.groupAdmin.toString() === userId && chat.users.length > 1) {
    res.status(400);
    throw new Error("Admin cannot remove themselves. Transfer admin rights first or remove all other members.");
  }

  const removed = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.json(removed);
});

// @desc    Add user to Group / Leave
// @route   PUT /api/chat/groupadd
// @access  Protected
const addToGroup = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  // check if the requester is admin

  const added = await Chat.findByIdAndUpdate(
    chatId,
    {
      $push: { users: userId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!added) {
    res.status(404);
    throw new Error("Chat Not Found");
  } else {
    res.json(added);
  }
});

// @desc    Hide Chat (only hides for current user, doesn't affect other user)
// @route   PUT /api/chat/hide/:chatId
// @access  Protected
const hideChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      res.status(404);
      throw new Error("Chat Not Found");
    }

    // Check if user is part of the chat
    const isUserInChat = chat.users.some(u => u.toString() === req.user._id.toString());

    if (!isUserInChat) {
      res.status(403);
      throw new Error("Not authorized to hide this chat");
    }

    // Add user to hiddenFor array (if not already there)
    await Chat.findByIdAndUpdate(chatId, {
      $addToSet: { hiddenFor: req.user._id }
    });

    res.json({ message: "Chat hidden successfully" });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

// @desc    Delete Chat (for one-to-one: hides only for current user; for groups: leaves the group)
// @route   DELETE /api/chat/:chatId
// @access  Protected
const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId);

    if (!chat) {
      res.status(404);
      throw new Error("Chat Not Found");
    }

    // Check if user is part of the chat
    const isUserInChat = chat.users.some(u => u.toString() === req.user._id.toString());

    if (!isUserInChat) {
      res.status(403);
      throw new Error("Not authorized to delete this chat");
    }

    if (chat.isGroupChat) {
      // Check if user is the admin
      const isAdmin = chat.groupAdmin && chat.groupAdmin.toString() === req.user._id.toString();

      // If admin is trying to leave and there are other members, prevent it
      if (isAdmin && chat.users.length > 1) {
        res.status(400);
        throw new Error("Admin cannot leave the group while other members are present. Please transfer admin rights or remove all members first.");
      }

      // For group chats: remove user from the group (leave group)
      await Chat.findByIdAndUpdate(chatId, {
        $pull: { users: req.user._id }
      });

      // If admin left and was the only member, delete the group entirely
      if (isAdmin && chat.users.length === 1) {
        await Chat.findByIdAndDelete(chatId);
        res.json({ message: "Group deleted successfully" });
      } else {
        res.json({ message: "Left the group successfully" });
      }
    } else {
      // For one-to-one chats: just hide the chat for this user (other user still sees it)
      await Chat.findByIdAndUpdate(chatId, {
        $addToSet: { hiddenFor: req.user._id }
      });
      res.json({ message: "Chat removed from your list" });
    }
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  hideChat,
  deleteChat,
};


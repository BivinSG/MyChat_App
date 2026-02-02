const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const cors = require("cors");

dotenv.config();
connectDB();
const app = express();

app.use(express.json()); // to accept json data

const aiRoutes = require("./routes/aiRoutes");

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/ai", aiRoutes);

// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "frontend", "build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  const server = app.listen(
    PORT,
    console.log(`Server running on PORT ${PORT}...`.yellow.bold)
  );

  const io = require("socket.io")(server, {
    pingTimeout: 60000,
    cors: {
      origin: "http://localhost:3000",
    },
  });

  setupSockets(io);
}

function setupSockets(io) {
  io.on("connection", (socket) => {
    console.log("Connected to socket.io");
    socket.on("setup", (userData) => {
      socket.join(userData._id);
      socket.emit("connected");
    });

    socket.on("join chat", (room) => {
      socket.join(room);
      console.log("User Joined Room: " + room);
    });
    socket.on("typing", (room) => socket.in(room).emit("typing", room));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing", room));

    socket.on("new message", (newMessageRecieved) => {
      var chat = newMessageRecieved.chat;
      if (!chat.users) return console.log("chat.users not defined");
      chat.users.forEach((user) => {
        if (user._id == newMessageRecieved.sender._id) return;
        socket.in(user._id).emit("message recieved", newMessageRecieved);
      });
    });

    socket.on("message read", (chatId) => {
      socket.in(chatId).emit("message read", chatId);
    });

    socket.on("message deleted", (data) => {
      socket.in(data.chatId).emit("message deleted", data);
    });

    socket.on("new group", (newGroup) => {
      newGroup.users.forEach((user) => {
        socket.in(user._id).emit("group created", newGroup);
      });
    });

    socket.on("member added", (data) => {
      if (data.addedUserId) {
        socket.in(data.addedUserId).emit("added to group", data.chat);
      }
      data.chat.users.forEach((user) => {
        socket.in(user._id).emit("group updated", data.chat);
      });
    });

    socket.on("member removed", (data) => {
      socket.in(data.removedUserId).emit("removed from group", {
        chatId: data.chat._id,
        chatName: data.chat.chatName
      });
      data.chat.users.forEach((user) => {
        socket.in(user._id).emit("group updated", data.chat);
      });
    });

    socket.on("chat deleted", (data) => {
      data.users.forEach((user) => {
        socket.in(user._id).emit("chat deleted", data.chatId);
      });
    });

    socket.on("disconnect", () => {
      console.log("USER DISCONNECTED");
    });
  });
}

module.exports = app;


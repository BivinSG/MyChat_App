import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useHistory } from "react-router-dom";
import io from "socket.io-client";

const ENDPOINT = "http://localhost:5000";
var socket;

const ChatContext = createContext();

// Helper function to validate user data
const isValidUserData = (userData) => {
  if (!userData) return false;
  if (!userData._id || !userData.token) return false;

  // Check if token is expired (if using JWT)
  try {
    const tokenPayload = JSON.parse(atob(userData.token.split('.')[1]));
    if (tokenPayload.exp && tokenPayload.exp * 1000 < Date.now()) {
      return false;
    }
  } catch (e) {
    // If token parsing fails, it might not be a JWT - allow it
  }

  return true;
};

const ChatProvider = ({ children }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [user, setUser] = useState();
  const [notification, setNotification] = useState([]);
  const [chats, setChats] = useState([]);
  const [typingChats, setTypingChats] = useState({}); // Track which chats have someone typing
  const [socketConnected, setSocketConnected] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState([]);

  // Track previous user to detect user changes
  const prevUserRef = useRef();

  const notificationSound = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");

  const playNotificationSound = () => {
    notificationSound.play().catch(e => console.log("Sound play error:", e));
  };

  const history = useHistory();

  useEffect(() => {
    try {
      const userInfoStr = sessionStorage.getItem("userInfo");

      if (!userInfoStr) {
        setUser(null);
        if (window.location.pathname === "/chats") {
          history.push("/");
        }
        return;
      }

      const userInfo = JSON.parse(userInfoStr);

      if (isValidUserData(userInfo)) {
        setUser(userInfo);
      } else {
        // Invalid or expired - clear it
        sessionStorage.removeItem("userInfo");
        setUser(null);
        if (window.location.pathname === "/chats") {
          history.push("/");
        }
      }
    } catch (e) {
      console.error("Error reading user info:", e);
      sessionStorage.removeItem("userInfo");
      setUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  // Listen for storage changes (for when user logs in/signs up)
  useEffect(() => {
    const handleStorageChange = () => {
      const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
      setUser(userInfo);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Reset all chat-related state when user changes (login/signup/logout)
  useEffect(() => {
    const prevUser = prevUserRef.current;

    // If user changed (different user logged in or user logged out)
    if (prevUser?._id !== user?._id) {
      // Reset all chat-related states for the new user
      setSelectedChat(null);
      setChats([]);
      setNotification([]);
      setTypingChats({});
      setSelectionMode(false);
      setSelectedChats([]);
    }

    // Update previous user reference
    prevUserRef.current = user;
  }, [user]);

  useEffect(() => {
    if (user) {
      socket = io(ENDPOINT);
      socket.emit("setup", user);
      socket.on("connected", () => setSocketConnected(true));

      // Listen for group updates (member added/removed)
      socket.on("group updated", (updatedChat) => {
        // Update the chat in the chats list
        setChats(prevChats =>
          prevChats.map(c => c._id === updatedChat._id ? updatedChat : c)
        );
        // If this is the selected chat, update it too
        setSelectedChat(prevSelected =>
          prevSelected?._id === updatedChat._id ? updatedChat : prevSelected
        );
      });

      // Listen for being added to a new group
      socket.on("added to group", (newChat) => {
        // Add the new group to the chat list
        setChats(prevChats => {
          // Check if chat already exists (avoid duplicates)
          if (prevChats.find(c => c._id === newChat._id)) {
            return prevChats;
          }
          return [newChat, ...prevChats];
        });
      });

      // Listen for being removed from a group
      socket.on("removed from group", (data) => {
        // Remove the chat from the list
        setChats(prevChats => prevChats.filter(c => c._id !== data.chatId));
        // If this was the selected chat, deselect it
        setSelectedChat(prevSelected =>
          prevSelected?._id === data.chatId ? null : prevSelected
        );
        // Show alert about removal
        alert(`You have been removed from the group "${data.chatName}"`);
      });

      return () => {
        socket.off("group updated");
        socket.off("added to group");
        socket.off("removed from group");
        socket.disconnect();
        setSocketConnected(false);
      };
    }
  }, [user]);

  return (
    <ChatContext.Provider
      value={{
        selectedChat,
        setSelectedChat,
        user,
        setUser,
        notification,
        setNotification,
        chats,
        setChats,
        typingChats,
        setTypingChats,
        socket,
        socketConnected,
        playNotificationSound,
        selectionMode,
        setSelectionMode,
        selectedChats,
        setSelectedChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const ChatState = () => {
  return useContext(ChatContext);
};

export default ChatProvider;


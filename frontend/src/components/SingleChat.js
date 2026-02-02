import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text, Flex } from "@chakra-ui/layout";
import "./styles.css";
import { IconButton, Spinner, useToast, Avatar, Menu, MenuButton, MenuList, MenuItem, useColorModeValue, useColorMode, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Button, VStack } from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { ArrowBackIcon, Search2Icon, AttachmentIcon, CloseIcon, ViewIcon } from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";


import { FiMoreVertical, FiSmile } from "react-icons/fi";
import { MdSend, MdImage, MdVideocam, MdInsertDriveFile, MdHeadset, MdLocationOn, MdDelete } from "react-icons/md";
import { FaLightbulb } from "react-icons/fa";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ForwardModal from "./miscellaneous/ForwardModal";
import { ChatState } from "../Context/ChatProvider";

// export var socket, selectedChatCompare;
var selectedChatCompare;


const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  // const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationUrl, setLocationUrl] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [mutedChats, setMutedChats] = useState(() => {
    const saved = localStorage.getItem('mutedChats');
    return saved ? JSON.parse(saved) : [];
  });
  const mutedChatsRef = useRef(mutedChats);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [messageToForward, setMessageToForward] = useState(null);
  const toast = useToast();


  // Reduced emoji set for faster loading
  const emojis = ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😋", "😛", "😜", "🤪", "😎", "🤩", "🥳", "😏", "😒", "😔", "😢", "😭", "😤", "😠", "😡", "🤯", "😳", "😱", "😰", "🤗", "🤔", "🤭", "🤫", "😶", "😐", "🙄", "😴", "🤮", "🤧", "😷", "🤒", "😈", "👿", "💩", "👻", "💀", "👽", "🤖", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💔", "💕", "💖", "💗", "💘", "💝", "👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "👋", "🙏", "💪", "🔥", "⭐", "✨", "💯", "💢", "💥", "💫", "💦", "🎉", "🎊", "🎁", "🏆", "🎯", "🚀"];


  const { selectedChat, setSelectedChat, user, notification, setNotification, typingChats, setTypingChats, socket, socketConnected, playNotificationSound } =
    ChatState();

  const { colorMode, toggleColorMode } = useColorMode();
  const headerBg = useColorModeValue("#f0f2f5", "#202c33");
  const chatAreaBg = useColorModeValue("#efeae2", "#0b141a");
  const textColor = useColorModeValue("black", "#e9edef");
  const secondaryTextColor = useColorModeValue("#667781", "#8696a0");
  const iconColor = useColorModeValue("#54656f", "#aebac1");
  const inputBg = useColorModeValue("white", "#2a3942");
  const borderColor = useColorModeValue("#d1d7db", "#222e35");
  const hoverBg = useColorModeValue("#f5f6f6", "#2a3942");

  const fetchMessages = useCallback(async () => {
    if (!selectedChat) return;

    // Handle Xerah Bot separately to avoid backend errors
    if (selectedChat._id === "xerah_bot") {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );
      setMessages(data);
      setLoading(false);

      if (socket) {
        socket.emit("join chat", selectedChat._id);
      }
      markMessagesAsRead(selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  }, [selectedChat, user, socket, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  const markMessagesAsRead = useCallback(async (chatId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      await axios.put(`/api/message/read/${chatId}`, {}, config);
      if (socket) {
        socket.emit("message read", chatId);
      }
    } catch (error) {
      console.log("Error marking messages as read:", error);
    }
  }, [user.token, socket]);

  const toggleMuteChat = () => {
    if (!selectedChat) return;

    const chatId = selectedChat._id;
    let newMutedChats;

    if (mutedChats.includes(chatId)) {
      newMutedChats = mutedChats.filter(id => id !== chatId);
      toast({
        title: "Notifications unmuted",
        description: `You will receive notifications from this chat`,
        status: "info",
        duration: 2000,
        position: "bottom-right",
      });
    } else {
      newMutedChats = [...mutedChats, chatId];
      toast({
        title: "Notifications muted",
        description: `You won't receive notifications from this chat`,
        status: "info",
        duration: 2000,
        position: "bottom-right",
      });
    }

    setMutedChats(newMutedChats);
    mutedChatsRef.current = newMutedChats;
    localStorage.setItem('mutedChats', JSON.stringify(newMutedChats));
  };

  const clearMessages = async () => {
    if (!selectedChat || selectedChat._id === "xerah_bot") {
      // For Xerah, just clear local state
      setMessages([]);
      toast({
        title: "Messages Cleared",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
      return;
    }

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      await axios.delete(`/api/message/${selectedChat._id}`, config);
      setMessages([]);
      setFetchAgain(!fetchAgain);

      toast({
        title: "Messages Cleared",
        description: "All messages have been deleted.",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to clear messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  };

  // eslint-disable-next-line no-unused-vars
  const deleteChat = async () => {
    if (!selectedChat || selectedChat._id === "xerah_bot") {
      toast({ title: "Cannot delete Xerah AI", status: "warning", position: "bottom-right" });
      return;
    }

    const isGroup = selectedChat.isGroupChat;

    // Check if user is admin of a group with other members
    if (isGroup && selectedChat.groupAdmin?._id === user._id && selectedChat.users.length > 1) {
      toast({
        title: "Cannot Leave Group",
        description: "You are the admin. Please transfer admin rights to another member or remove all members first.",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
      return;
    }

    const confirmMsg = isGroup
      ? "Are you sure you want to leave this group?"
      : "Remove this chat from your list? The other user can still see the chat.";

    if (window.confirm(confirmMsg)) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        await axios.delete(`/api/chat/${selectedChat._id}`, config);

        setSelectedChat("");
        setFetchAgain(!fetchAgain);

        toast({
          title: isGroup ? "Left Group" : "Chat Removed",
          description: isGroup
            ? "You have left the group successfully."
            : "Chat removed from your list. You can still receive new messages.",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "bottom-right",
        });
      } catch (error) {
        toast({
          title: "Error Occurred!",
          description: error.response?.data?.message || "Failed to remove chat",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom-right",
        });
      }
    }
  };

  const handleBulkDeleteMessages = async () => {
    if (selectedMessages.length === 0) return;

    if (window.confirm(`Delete ${selectedMessages.length} message(s)?`)) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        // For simplicity, we'll delete them one by one or we could add a bulk endpoint
        // Since we already have single delete, let's use that in parallel
        await Promise.all(
          selectedMessages.map(msgId =>
            axios.delete(`/api/message/single/${msgId}`, config)
          )
        );

        setMessages(messages.filter(m => !selectedMessages.includes(m._id)));
        setSelectionMode(false);

        // Emit socket event for real-time deletion
        if (socket) {
          socket.emit("message deleted", { messageIds: selectedMessages, chatId: selectedChat._id });
        }

        setSelectedMessages([]);

        toast({
          title: "Messages deleted",
          status: "success",
          duration: 3000,
          position: "bottom-right",
        });
      } catch (error) {
        toast({
          title: "Error deleting messages",
          status: "error",
          duration: 5000,
          position: "bottom-right",
        });
      }
    }
  };

  // File attachment ref and handlers
  const fileInputRef = useRef(null);

  const sendAttachment = async (content) => {
    if (selectedChat._id === "xerah_bot") {
      toast({ title: "Attachments not supported for AI yet", status: "warning", duration: 3000, isClosable: true, position: "bottom-right" });
      return;
    }

    try {
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(
        "/api/message",
        {
          content: content,
          chatId: selectedChat,
        },
        config
      );

      if (socket) {
        socket.emit("new message", data);
      }
      playNotificationSound();
      setMessages([...messages, data]);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to send attachment",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) { // 25MB limit for documents/audio
      toast({ title: "File too large", description: "Max 25MB", status: "warning", position: "bottom-right" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      sendAttachment(e.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const sendCurrentLocation = () => {
    window.open("https://www.google.com/maps", "_blank");
    // Don't close modal - let user paste URL back
  };

  const sendLocationUrl = () => {
    if (locationUrl.trim()) {
      let finalUrl = locationUrl.trim();

      // Check if it's a Plus Code (contains + and not a URL)
      if (!finalUrl.startsWith('http') && finalUrl.includes('+')) {
        // Convert Plus Code to Google Maps URL
        finalUrl = `https://maps.google.com/?q=${encodeURIComponent(finalUrl)}`;
      }

      sendAttachment(finalUrl);
      setLocationUrl("");
      setShowLocationModal(false);
    } else {
      toast({ title: "Please enter a location", status: "warning", position: "bottom-right" });
    }
  };

  const shareLiveLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        sendAttachment(`https://maps.google.com/?q=${latitude},${longitude}`);
        setShowLocationModal(false);
      }, (error) => {
        toast({ title: "Location Error", description: error.message, status: "error", position: "bottom-right" });
      });
    } else {
      toast({ title: "Geolocation not supported", status: "error", position: "bottom-right" });
    }
  };

  const handleAttachment = (type) => {
    if (type === "location") {
      setShowLocationModal(true);
      return;
    }

    if (fileInputRef.current) {
      if (type === "image") fileInputRef.current.accept = "image/*";
      else if (type === "video") fileInputRef.current.accept = "video/*";
      else if (type === "audio") fileInputRef.current.accept = "audio/*";
      else fileInputRef.current.accept = "*";

      fileInputRef.current.click();
    }
  };

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      if (selectedChat._id === "xerah_bot") {
        const currentInput = newMessage;
        const userMsg = {
          _id: Date.now().toString() + "_user",
          content: currentInput,
          sender: user,
          chat: selectedChat,
          createdAt: new Date().toISOString()
        };

        setMessages((prev) => [...prev, userMsg]);
        setNewMessage("");
        setIsTyping(true);

        setTimeout(async () => {
          try {
            const config = {
              headers: {
                Authorization: `Bearer ${user.token}`,
              },
            };
            const { data } = await axios.post(
              "/api/ai/chat",
              { message: currentInput },
              config
            );

            const botMsg = {
              _id: Date.now().toString() + "_bot",
              content: data.response || "I am your Xerah AI Assistant. How can I help you today?",
              sender: {
                _id: "bot",
                name: "Xerah AI",
                pic: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Meta_AI_logo.svg"
              },
              chat: selectedChat,
              createdAt: new Date().toISOString()
            };
            setMessages((prev) => [...prev, botMsg]);
            playNotificationSound();
          } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "I'm having a bit of trouble connecting to my systems. Please try again in a moment!";
            const errorMsg = {
              _id: Date.now().toString() + "_error",
              content: errorMessage,
              sender: { _id: "bot", name: "Xerah AI", pic: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Meta_AI_logo.svg" },
              chat: selectedChat,
              createdAt: new Date().toISOString()
            };
            setMessages((prev) => [...prev, errorMsg]);
          } finally {
            setIsTyping(false);
          }
        }, 1200);
        return;
      }

      if (socket) {
        socket.emit("stop typing", selectedChat._id);
      }
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");
        const { data } = await axios.post(
          "/api/message",
          {
            content: newMessage,
            chatId: selectedChat,
          },
          config
        );
        if (socket) {
          socket.emit("new message", data);
        }
        playNotificationSound();
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom-right",
        });
      }
    }
  };


  // Separate useEffect for typing events to ensure they always work
  useEffect(() => {
    if (!socket) return;

    const handleTyping = (room) => {
      setTypingChats(prev => ({ ...prev, [room]: true }));
    };

    const handleStopTyping = (room) => {
      setTypingChats(prev => ({ ...prev, [room]: false }));
    };

    socket.on("typing", handleTyping);
    socket.on("stop typing", handleStopTyping);

    const onFocus = () => {
      if (selectedChatCompare) {
        markMessagesAsRead(selectedChatCompare._id);
      }
    };

    window.addEventListener("focus", onFocus);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stop typing", handleStopTyping);
      window.removeEventListener("focus", onFocus);
    };
  }, [setTypingChats, selectedChat, markMessagesAsRead, socket]);

  useEffect(() => {
    fetchMessages();
    setSelectionMode(false);
    setSelectedMessages([]);
    selectedChatCompare = selectedChat;

    // Clear notifications for this chat when it's selected
    if (selectedChat) {
      setNotification(notification.filter((n) => n.chat._id !== selectedChat._id));
    }
    // eslint-disable-next-line
  }, [selectedChat, fetchMessages]);

  useEffect(() => {
    if (!socket) return;
    socket.on("message recieved", (newMessageRecieved) => {
      playNotificationSound();
      if (
        !selectedChatCompare || // if chat is not selected or doesn't match current chat
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        // Only show notification if chat is not muted
        const isMuted = mutedChatsRef.current.includes(newMessageRecieved.chat._id);
        if (!isMuted) {
          setNotification((prevNotifications) => {
            if (!prevNotifications.find((n) => n._id === newMessageRecieved._id)) {
              return [newMessageRecieved, ...prevNotifications];
            }
            return prevNotifications;
          });
          playNotificationSound();
        }
        setFetchAgain(!fetchAgain);
      } else {
        // Don't duplicate for Xerah messages
        if (selectedChatCompare._id !== "xerah_bot") {
          setMessages((prevMessages) => [...prevMessages, newMessageRecieved]);
        }
        markMessagesAsRead(newMessageRecieved.chat._id);
      }
    });

    socket.on("message read", (chatId) => {
      if (selectedChatCompare && selectedChatCompare._id === chatId) {
        const fetchSilently = async () => {
          try {
            const config = {
              headers: { Authorization: `Bearer ${user.token}` },
            };
            const { data } = await axios.get(`/api/message/${chatId}`, config);
            setMessages(data);
          } catch (e) { }
        };
        fetchSilently();
      }
    });

    socket.on("message deleted", (data) => {
      if (selectedChatCompare && selectedChatCompare._id === data.chatId) {
        setMessages((prev) => prev.filter((m) => !data.messageIds.includes(m._id)));
      }
    });

    return () => {
      socket.off("message recieved");
      socket.off("message read");
      socket.off("message deleted");
    };
  }, [fetchAgain, setFetchAgain, setNotification, user.token, socket, markMessagesAsRead, playNotificationSound]);

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      if (socket) {
        socket.emit("typing", selectedChat._id);
      }
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        if (socket) {
          socket.emit("stop typing", selectedChat._id);
        }
        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <>
      {selectedChat ? (
        <>
          {/* Chat Header */}
          <Box
            d="flex"
            justifyContent="space-between"
            alignItems="center"
            bg={headerBg}
            w="100%"
            p="10px 16px"
            borderLeft={`1px solid ${borderColor}`}
          >
            {selectionMode ? (
              <Flex w="100%" justifyContent="space-between" alignItems="center">
                <Flex alignItems="center">
                  <IconButton
                    icon={<CloseIcon />}
                    variant="ghost"
                    onClick={() => {
                      setSelectionMode(false);
                      setSelectedMessages([]);
                    }}
                    mr={4}
                  />
                  <Text fontSize="md" fontWeight="semibold">
                    {selectedMessages.length} selected
                  </Text>
                </Flex>
                <IconButton
                  icon={<MdDelete />}
                  colorScheme="red"
                  variant="ghost"
                  onClick={handleBulkDeleteMessages}
                  isDisabled={selectedMessages.length === 0}
                  fontSize="24px"
                />
              </Flex>
            ) : (
              <>
                <Flex alignItems="center">
                  <IconButton
                    d={{ base: "flex", md: "none" }}
                    icon={<ArrowBackIcon />}
                    onClick={() => setSelectedChat("")}
                    variant="ghost"
                    mr={2}
                  />
                  {selectedChat.isGroupChat ? (
                    <Avatar size="sm" mr={3} name={selectedChat.chatName} />
                  ) : (
                    <Avatar
                      size="sm"
                      mr={3}
                      name={getSender(user, selectedChat.users)}
                      src={getSenderFull(user, selectedChat.users).pic}
                    />
                  )}
                  <Box>
                    <Text fontSize="md" fontWeight="semibold" color={textColor}>
                      {selectedChat._id === "xerah_bot" ? "Xerah AI" : (!selectedChat.isGroupChat
                        ? getSender(user, selectedChat.users)
                        : selectedChat.chatName)}
                    </Text>
                    <Text fontSize="xs" color={secondaryTextColor}>
                      {selectedChat._id === "xerah_bot" && istyping ? "Xerah is thinking..." :
                        typingChats[selectedChat._id] ? "typing..." : "online"}
                    </Text>
                  </Box>
                </Flex>
                <Flex alignItems="center">
                  <IconButton
                    variant="ghost"
                    icon={<FaLightbulb />}
                    onClick={toggleColorMode}
                    color={colorMode === "light" ? iconColor : "yellow.400"}
                    borderRadius="full"
                    aria-label="Toggle Dark Mode"
                    mr={2}
                  />
                  {showSearch ? (
                    <Flex alignItems="center" bg={inputBg} borderRadius="full" px={2} mr={2}>
                      <Input
                        placeholder="Search..."
                        variant="unstyled"
                        size="sm"
                        w="150px"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                      />
                      <IconButton
                        size="xs"
                        icon={<CloseIcon />}
                        variant="ghost"
                        onClick={() => {
                          setShowSearch(false);
                          setSearchQuery("");
                        }}
                      />
                    </Flex>
                  ) : (
                    <IconButton
                      icon={<Search2Icon />}
                      variant="ghost"
                      color={iconColor}
                      borderRadius="full"
                      onClick={() => setShowSearch(true)}
                    />
                  )}
                  {selectedChat.isGroupChat && (
                    <UpdateGroupChatModal
                      fetchMessages={fetchMessages}
                      fetchAgain={fetchAgain}
                      setFetchAgain={setFetchAgain}
                    >
                      <IconButton
                        d={{ base: "flex" }}
                        icon={<ViewIcon />}
                        variant="ghost"
                        color={iconColor}
                        borderRadius="full"
                      />
                    </UpdateGroupChatModal>
                  )}
                  <Menu>
                    <MenuButton as={IconButton} icon={<FiMoreVertical />} variant="ghost" color={iconColor} borderRadius="full" />
                    <MenuList>
                      {!selectedChat.isGroupChat ? (
                        <ProfileModal user={getSenderFull(user, selectedChat.users)}>
                          <MenuItem>Contact info</MenuItem>
                        </ProfileModal>
                      ) : (
                        <UpdateGroupChatModal
                          fetchMessages={fetchMessages}
                          fetchAgain={fetchAgain}
                          setFetchAgain={setFetchAgain}
                        >
                          <MenuItem>Group info</MenuItem>
                        </UpdateGroupChatModal>
                      )}
                      <MenuItem onClick={() => setSelectedChat("")}>Close chat</MenuItem>
                      <MenuItem onClick={toggleMuteChat}>
                        {mutedChats.includes(selectedChat._id) ? "🔔 Unmute notifications" : "🔕 Mute notifications"}
                      </MenuItem>
                      <MenuItem onClick={clearMessages} color="red.500">Clear Chat</MenuItem>
                    </MenuList>
                  </Menu>
                </Flex>
              </>
            )}
          </Box>

          {/* Chat Area */}
          <Box
            d="flex"
            flexDir="column"
            justifyContent="flex-end"
            bg={chatAreaBg}
            w="100%"
            h="100%"
            overflowY="hidden"
            borderLeft={`1px solid ${borderColor}`}
            position="relative"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
                color="#00a884"
              />
            ) : (
              <div className="messages" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', scrollbarWidth: 'none' }}>
                <ScrollableChat
                  messages={messages.filter(m =>
                    m.content.toLowerCase().includes(searchQuery.toLowerCase())
                  )}
                  setMessages={setMessages}
                  selectionMode={selectionMode}
                  setSelectionMode={setSelectionMode}
                  selectedMessages={selectedMessages}
                  setSelectedMessages={setSelectedMessages}
                  socket={socket}
                  onForwardMessage={(msg) => {
                    setMessageToForward(msg);
                    setShowForwardModal(true);
                  }}
                />
              </div>
            )}

            {/* Typing Indicator */}
            {(typingChats[selectedChat._id] || (selectedChat._id === "xerah_bot" && istyping)) && (
              <Box className="typing-container">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </Box>
            )}

            {/* Message Input Area */}

            <Box p="5px 10px" bg={headerBg} d="flex" alignItems="center">
              <Menu placement="top-start" closeOnSelect={false} isLazy={false}>
                <MenuButton as={IconButton} icon={<FiSmile />} variant="ghost" color={iconColor} fontSize="22px" borderRadius="full" />
                <MenuList maxH="200px" overflowY="auto" p={2} sx={{ animation: 'none' }}>
                  <Flex flexWrap="wrap" w="250px">
                    {emojis.map((emoji, index) => (
                      <Box
                        key={index}
                        cursor="pointer"
                        fontSize="20px"
                        p={1}
                        _hover={{ bg: hoverBg }}
                        onClick={() => setNewMessage(newMessage + emoji)}
                      >
                        {emoji}
                      </Box>
                    ))}
                  </Flex>
                </MenuList>
              </Menu>
              <Menu placement="top-start">
                <MenuButton as={IconButton} icon={<AttachmentIcon />} variant="ghost" color={iconColor} fontSize="20px" borderRadius="full" mr={2} />
                <MenuList>
                  <MenuItem icon={<MdImage size={24} />} onClick={() => handleAttachment('image')}>Image</MenuItem>
                  <MenuItem icon={<MdVideocam size={24} />} onClick={() => handleAttachment('video')}>Video</MenuItem>
                  <MenuItem icon={<MdInsertDriveFile size={24} />} onClick={() => handleAttachment('file')}>Document</MenuItem>
                  <MenuItem icon={<MdHeadset size={24} />} onClick={() => handleAttachment('audio')}>Audio</MenuItem>
                  <MenuItem icon={<MdLocationOn size={24} />} onClick={() => handleAttachment('location')}>Location</MenuItem>
                </MenuList>
              </Menu>


              <FormControl
                onKeyDown={sendMessage}
                id="message-input"
                isRequired
                autoComplete="off"
              >
                <Input
                  variant="outline"
                  bg={inputBg}
                  color={textColor}
                  placeholder="Type a message"
                  border="none"
                  borderRadius="8px"
                  _placeholder={{ color: secondaryTextColor }}
                  _focus={{ boxShadow: "none" }}
                  value={newMessage}
                  onChange={typingHandler}
                  isDisabled={selectionMode}
                  autoComplete="off"
                />
              </FormControl>
              <input
                type="file"
                multiple={false}
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileSelect}
              />
              <IconButton
                icon={<MdSend />}
                variant="ghost"
                color={iconColor}
                fontSize="22px"
                borderRadius="full"
                ml={1}
                onClick={() => sendMessage({ key: 'Enter' })}
                isDisabled={selectionMode}
              />
            </Box>
          </Box>
        </>
      ) : (
        <Box d="flex" flexDir="column" alignItems="center" justifyContent="center" h="100%" bg={headerBg} w="100%" borderLeft={`1px solid ${borderColor}`}>
          <Text fontSize="4xl" fontFamily="'Pacifico', cursive" fontStyle="italic" color="#00a884" mb={2}>
            Talk-A-Tive
          </Text>
          {/* Xerah Logo - Clickable */}
          <Box
            w="80px"
            h="80px"
            borderRadius="full"
            bg="linear-gradient(45deg, #00f2fe 0%, #4facfe 100%)"
            d="flex"
            alignItems="center"
            justifyContent="center"
            mb={4}
            boxShadow="0 4px 20px rgba(0, 242, 254, 0.4)"
            cursor="pointer"
            _hover={{ transform: "scale(1.1)", boxShadow: "0 6px 25px rgba(0, 242, 254, 0.6)" }}
            transition="all 0.2s"
            onClick={() => {
              setSelectedChat({
                _id: "xerah_bot",
                chatName: "Xerah AI",
                isGroupChat: false,
                users: [{ name: "Xerah", pic: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Meta_AI_logo.svg", _id: "bot" }]
              });
            }}
          >
            <Box w="40px" h="40px" borderRadius="full" border="5px solid white" />
          </Box>
          <Text fontSize="xl" fontWeight="light" color={textColor}>
            Welcome to Talk-A-Tive
          </Text>
          <Text color={secondaryTextColor} mt={2} textAlign="center" maxW="400px">
            Send and receive messages instantly. <br />
            Click on a chat to start messaging or connect with new people!
          </Text>
        </Box>
      )}

      {/* Location Modal */}
      <Modal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Share Location</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontSize="sm" mb={2} color={secondaryTextColor}>
                  Enter Plus Code or Google Maps URL:
                </Text>
                <Input
                  placeholder="e.g., WCR2+3R Mamala, Kerala"
                  value={locationUrl}
                  onChange={(e) => setLocationUrl(e.target.value)}
                  size="md"
                />
                <Button
                  colorScheme="green"
                  width="100%"
                  mt={2}
                  onClick={sendLocationUrl}
                  isDisabled={!locationUrl.trim()}
                >
                  Send Location
                </Button>
              </Box>

              <Text textAlign="center" fontSize="sm" color={secondaryTextColor}>OR</Text>

              <Button
                leftIcon={<MdLocationOn />}
                colorScheme="blue"
                size="md"
                onClick={sendCurrentLocation}
              >
                Open Maps to Find Location
              </Button>

              <Button
                leftIcon={<MdLocationOn />}
                variant="outline"
                size="md"
                onClick={shareLiveLocation}
              >
                Share Live Location
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Forward Modal */}
      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => {
          setShowForwardModal(false);
          setMessageToForward(null);
        }}
        content={messageToForward?.content || ""}
      />
    </>
  );
};

export default SingleChat;

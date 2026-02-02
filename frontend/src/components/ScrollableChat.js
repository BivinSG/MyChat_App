import { useColorModeValue, Menu, MenuButton, MenuList, MenuItem, IconButton, useToast, Box, Flex, Checkbox } from "@chakra-ui/react";
import { Text } from "@chakra-ui/layout";
import ScrollableFeed from "react-scrollable-feed";
import { isSameUser } from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useState } from "react";
import { MdContentCopy, MdInfo, MdDelete, MdCheckBox, MdForward } from "react-icons/md";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import axios from "axios";

const ScrollableChat = ({ messages, setMessages, selectionMode, setSelectionMode, selectedMessages, setSelectedMessages, socket, onForwardMessage }) => {
  const { user, selectedChat } = ChatState();
  const [expandedMessage, setExpandedMessage] = useState(null);
  const toast = useToast();

  const outgoingBg = useColorModeValue("#d9fdd3", "#005c4b");
  const incomingBg = useColorModeValue("#ffffff", "#202c33");
  const textColor = useColorModeValue("black", "#e9edef");
  const timeColor = useColorModeValue("#667781", "#8696a0");
  const hoverBg = useColorModeValue("#f5f6f6", "#2a3942");

  const copyMessage = (content) => {
    let textToCopy = content;
    if (content.startsWith("data:")) {
      textToCopy = "[Media file]";
    } else if (content.startsWith("https://maps.google.com")) {
      textToCopy = content;
    }

    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to clipboard",
      status: "success",
      duration: 2000,
      position: "bottom-right",
    });
  };

  const deleteMessage = async (messageId) => {
    if (window.confirm("Delete this message? This cannot be undone.")) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        await axios.delete(`/api/message/single/${messageId}`, config);
        setMessages(messages.filter(m => m._id !== messageId));

        // Emit socket event for real-time deletion for everyone
        if (socket) {
          socket.emit("message deleted", { messageIds: [messageId], chatId: selectedChat._id });
        }

        toast({
          title: "Message deleted",
          status: "success",
          duration: 2000,
          position: "bottom-right",
        });
      } catch (error) {
        toast({
          title: "Error deleting message",
          description: error.response?.data?.message || "Failed to delete",
          status: "error",
          duration: 3000,
          position: "bottom-right",
        });
      }
    }
  };

  const toggleSelection = (messageId) => {
    setSelectedMessages(prev =>
      prev.includes(messageId)
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const showMessageInfo = (message) => {
    const date = new Date(message.createdAt);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    toast({
      title: "Message Info",
      description: `Sent on ${dateStr} at ${timeStr}`,
      status: "info",
      duration: 5000,
      isClosable: true,
      position: "bottom-right",
    });
  };

  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => (
          <Flex
            key={m._id}
            flexDirection={m.sender?._id === user?._id ? "row-reverse" : "row"}
            mb={isSameUser(messages, m, i) ? "2px" : "10px"}
            px="5%"
            alignItems="center"
            onMouseEnter={() => setExpandedMessage(m._id)}
            onMouseLeave={() => setExpandedMessage(null)}
            _hover={{ bg: selectionMode ? "transparent" : hoverBg }}
            borderRadius="md"
            transition="background 0.2s"
            position="relative"
            onClick={() => selectionMode && toggleSelection(m._id)}
            cursor={selectionMode ? "pointer" : "default"}
          >
            {/* Selection Checkbox */}
            {selectionMode && (
              <Box
                mr={m.sender?._id === user?._id ? 0 : 2}
                ml={m.sender?._id === user?._id ? 2 : 0}
              >
                <Checkbox
                  isChecked={selectedMessages.includes(m._id)}
                  onChange={() => toggleSelection(m._id)}
                  colorScheme="teal"
                />
              </Box>
            )}

            {/* Dropdown Menu Icon */}
            {/* Message Bubble */}
            <Box
              bg={m.sender?._id === user?._id ? outgoingBg : incomingBg}
              color={textColor}
              borderRadius="8px"
              p="6px 10px"
              maxW="65%"
              fontSize="16px"
              fontFamily="'Work Sans', sans-serif"
              boxShadow="0 1px 0.5px rgba(11,20,26,.13)"
              position="relative"
              display="flex"
              flexDirection="column"
              opacity={selectionMode && !selectedMessages.includes(m._id) ? 0.7 : 1}
              border={selectionMode && selectedMessages.includes(m._id) ? "1px solid #00a884" : "none"}
            >
              {/* Dropdown Menu Icon - Absolute Positioned inside Bubble for Stability */}
              {!selectionMode && expandedMessage === m._id && (
                <Box
                  position="absolute"
                  top="2px"
                  right={m.sender?._id === user?._id ? "2px" : "auto"}
                  left={m.sender?._id === user?._id ? "auto" : "2px"}
                  zIndex={10}
                >
                  <Menu isLazy placement="top-end" autoSelect={false}>
                    <MenuButton
                      as={IconButton}
                      icon={<ChevronDownIcon />}
                      variant="ghost"
                      size="xs"
                      p={0}
                      minW="20px"
                      h="20px"
                      borderRadius="full"
                      bg={m.sender?._id === user?._id ? outgoingBg : incomingBg}
                      _hover={{ bg: hoverBg }}
                      aria-label="Message options"
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                    <MenuList zIndex={20}>
                      <MenuItem icon={<MdInfo />} onClick={() => showMessageInfo(m)}>
                        Message Info
                      </MenuItem>
                      <MenuItem icon={<MdContentCopy />} onClick={() => copyMessage(m.content)}>
                        Copy
                      </MenuItem>
                      <MenuItem icon={<MdForward />} onClick={() => onForwardMessage && onForwardMessage(m)}>
                        Forward
                      </MenuItem>
                      <MenuItem icon={<MdCheckBox />} onClick={() => {
                        setSelectionMode(true);
                        setSelectedMessages([m._id]);
                      }}>
                        Select
                      </MenuItem>
                      <MenuItem icon={<MdDelete />} onClick={() => deleteMessage(m._id)} color="red.500">
                        Delete
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Box>
              )}

              {selectedChat.isGroupChat && m.sender?._id !== user?._id && (
                <Text fontSize="xs" fontWeight="bold" color="#e542a3" mb={1} pr={expandedMessage === m._id ? 6 : 0}>
                  {m.sender.name}
                </Text>
              )}
              {m.content?.startsWith("data:image") ? (
                <img src={m.content} alt="img" style={{ borderRadius: "5px", marginTop: "5px", maxWidth: "100%" }} />
              ) : m.content?.startsWith("data:video") ? (
                <video src={m.content} controls style={{ borderRadius: "5px", marginTop: "5px", maxWidth: "100%" }} />
              ) : m.content?.startsWith("data:audio") ? (
                <audio src={m.content} controls style={{ marginTop: "5px", maxWidth: "100%" }} />
              ) : m.content?.startsWith("https://maps.google.com") ? (
                <a href={m.content} target="_blank" rel="noreferrer" style={{ color: "#00a884", textDecoration: "underline" }}>
                  📍 Location: View on Map
                </a>
              ) : (
                <Text pr={(!selectionMode && expandedMessage === m._id) ? 6 : 0}>
                  {m.content}
                </Text>
              )}

              <Flex justifyContent="flex-end" alignItems="center" mt={1} mb="-2px">
                <Text
                  fontSize="10px"
                  color={timeColor}
                  mr={1}
                >
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>

                {/* Blue Tick Feature */}
                {m.sender?._id === user?._id && (
                  <Box>
                    <IoCheckmarkDoneSharp
                      size="16px"
                      color={(m.readBy && m.readBy.length > 1) ? "#53bdeb" : timeColor}
                      style={{ opacity: (m.readBy && m.readBy.length > 1) ? 1 : 0.6 }}
                    />
                  </Box>
                )}
              </Flex>
            </Box>
          </Flex>
        ))}
    </ScrollableFeed>
  );
};

export default ScrollableChat;

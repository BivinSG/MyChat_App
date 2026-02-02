import { SearchIcon } from "@chakra-ui/icons";
import { Box, Stack, Text, Flex } from "@chakra-ui/layout";
import { useToast } from "@chakra-ui/toast";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import ChatLoading from "./ChatLoading";
import GroupChatModal from "./miscellaneous/GroupChatModal";
import { Avatar, IconButton, Input, InputGroup, InputLeftElement, Menu, MenuButton, MenuDivider, MenuItem, MenuList, Spinner, Checkbox } from "@chakra-ui/react";
import { MdDelete, MdClose } from "react-icons/md";
import { ChatState } from "../Context/ChatProvider";
import ProfileModal from "./miscellaneous/ProfileModal";
import { BellIcon, ChevronDownIcon } from "@chakra-ui/icons";
import UserListItem from "./userAvatar/UserListItem";
import { FaLightbulb } from "react-icons/fa";
import { useHistory } from "react-router-dom";
import { useColorMode, useColorModeValue } from "@chakra-ui/react";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import NotificationBadge from "react-notification-badge";
import { Effect } from "react-notification-badge";

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [showXerahPopup, setShowXerahPopup] = useState(false);

  const { selectedChat, setSelectedChat, user, chats, setChats, notification, setNotification, typingChats, socket, selectionMode, setSelectionMode, selectedChats, setSelectedChats } = ChatState();

  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();

  const bgColor = useColorModeValue("white", "#111b21");
  const headerBg = useColorModeValue("#f0f2f5", "#202c33");
  const textColor = useColorModeValue("black", "#e9edef");
  const secondaryTextColor = useColorModeValue("#667781", "#8696a0");
  const borderColor = useColorModeValue("#e2e8f0", "#222e35");
  const hoverBg = useColorModeValue("#f5f6f6", "#2a3942");
  const selectedBg = useColorModeValue("#f0f2f5", "#2a3942");
  const searchBg = useColorModeValue("#f0f2f5", "#202c33");
  const iconColor = useColorModeValue("#54656f", "#aebac1");
  const history = useHistory();

  const logoutHandler = () => {
    sessionStorage.clear();
    history.push("/");
  };

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) {
      setSearchResult([]);
      return;
    }

    try {
      setLoading(true);

      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(`/api/user?search=${query}`, config);

      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  };

  const accessChat = async (userId) => {
    try {
      setLoadingChat(true);
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post(`/api/chat`, { userId }, config);

      // Add new chat to the list if it doesn't exist
      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }
      setSelectedChat(data);
      setLoadingChat(false);
    } catch (error) {
      setLoadingChat(false);
      toast({
        title: "Error fetching the chat",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  };

  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get("/api/chat", config);
      setChats(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
    }
  };

  const deleteSelectedChats = async () => {
    if (selectedChats.length === 0) return;

    // Check if user is admin of any selected group with other members
    const adminGroups = chats.filter(c =>
      selectedChats.includes(c._id) &&
      c.isGroupChat &&
      c.groupAdmin?._id === user._id &&
      c.users.length > 1
    );

    if (adminGroups.length > 0) {
      toast({
        title: "Cannot Leave Some Groups",
        description: `You are admin of ${adminGroups.length} group(s). Transfer admin rights or remove members first.`,
        status: "warning",
        duration: 5000,
        position: "bottom-right",
      });
      // Remove admin groups from selection
      const validChats = selectedChats.filter(id => !adminGroups.find(g => g._id === id));
      if (validChats.length === 0) return;
      setSelectedChats(validChats);
    }

    if (window.confirm(`Remove ${selectedChats.length} chat(s) from your list? The other user can still see the chat.`)) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const successfulDeletes = [];
        for (const chatId of selectedChats) {
          try {
            await axios.delete(`/api/chat/${chatId}`, config);
            successfulDeletes.push(chatId);
          } catch (err) {
            // Log error but continue with other chats
            console.error(`Failed to delete chat ${chatId}:`, err.response?.data?.message);
          }
        }

        setChats(chats.filter(c => !successfulDeletes.includes(c._id)));
        if (selectedChat && successfulDeletes.includes(selectedChat._id)) {
          setSelectedChat("");
        }
        setSelectionMode(false);
        setSelectedChats([]);

        toast({
          title: "Chats removed from your list",
          description: successfulDeletes.length < selectedChats.length
            ? `Removed ${successfulDeletes.length} of ${selectedChats.length} chats`
            : "You can still receive new messages from these chats",
          status: "success",
          duration: 3000,
          position: "bottom-right",
        });
      } catch (error) {
        toast({
          title: "Error removing chats",
          description: error.response?.data?.message || "Some chats could not be removed",
          status: "error",
          duration: 5000,
          position: "bottom-right",
        });
      }
    }
  };

  const toggleChatSelection = (chatId) => {
    setSelectedChats(prev =>
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  useEffect(() => {
    const userInfo = JSON.parse(sessionStorage.getItem("userInfo"));
    setLoggedUser(userInfo || user);
    if (user) {
      fetchChats();
    }
    // eslint-disable-next-line
  }, [fetchAgain, user]);

  useEffect(() => {
    if (socket) {
      socket.on("group created", (newGroup) => {
        setChats((prevChats) => {
          if (!prevChats.find((c) => c._id === newGroup._id)) {
            return [newGroup, ...prevChats];
          }
          return prevChats;
        });
      });

      socket.on("chat deleted", (deletedChatId) => {
        setChats((prevChats) => prevChats.filter(c => c._id !== deletedChatId));
        if (selectedChatRef.current && selectedChatRef.current._id === deletedChatId) {
          setSelectedChat("");
        }
      });

      return () => {
        socket.off("group created");
        socket.off("chat deleted");
      };
    }
  }, [socket, setChats, setSelectedChat]);

  // Use ref to keep track of selectedChat for socket callbacks
  const selectedChatRef = useRef(selectedChat);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  return (
    <Box
      d={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      bg={bgColor}
      w={{ base: "100%", md: "31%" }}
      borderRightWidth="1px"
      borderRightColor={borderColor}
      position="relative"
    >
      {/* Sidebar Header */}
      <Box
        p="10px 16px"
        bg={headerBg}
        d="flex"
        w="100%"
        justifyContent="space-between"
        alignItems="center"
      >
        <ProfileModal user={user}>
          <Avatar
            size="sm"
            cursor="pointer"
            name={user.name}
            src={user.pic}
          />
        </ProfileModal>
        <Flex alignItems="center">
          <IconButton
            variant="ghost"
            icon={<FaLightbulb />}
            onClick={toggleColorMode}
            color={colorMode === "light" ? "#54656f" : "yellow.400"}
            borderRadius="full"
            aria-label="Toggle Dark Mode"
          />
          <Menu>
            <MenuButton p={1}>
              <NotificationBadge
                count={notification.length}
                effect={Effect.SCALE}
              />
              <BellIcon fontSize="2xl" m={1} color={iconColor} />
            </MenuButton>
            <MenuList pl={2}>
              {!notification.length && "No New Messages"}
              {notification.map((notif) => (
                <MenuItem
                  key={notif._id}
                  onClick={() => {
                    setSelectedChat(notif.chat);
                    setNotification(notification.filter((n) => n._id !== notif._id));
                  }}
                >
                  <Box>
                    <Text fontWeight="semibold" fontSize="sm">
                      {notif.chat.isGroupChat
                        ? `New Message in ${notif.chat.chatName}`
                        : `New Message from ${getSender(user, notif.chat.users)}`}
                    </Text>
                    <Text fontSize="xs" color={secondaryTextColor} isTruncated maxW="200px">
                      {notif.content?.startsWith("data:image") ? "📷 Photo" :
                        notif.content?.startsWith("data:video") ? "🎥 Video" :
                          notif.content?.startsWith("data:audio") ? "🎵 Audio" :
                            notif.content?.startsWith("https://maps.google.com") ? "📍 Location" :
                              notif.content?.length > 30 ? `${notif.content.substring(0, 30)}...` : notif.content}
                    </Text>
                  </Box>
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          <Menu>
            <MenuButton
              as={IconButton}
              icon={<ChevronDownIcon />}
              variant="ghost"
              color={iconColor}
              borderRadius="full"
            />
            <MenuList>
              <GroupChatModal>
                <MenuItem>New Group</MenuItem>
              </GroupChatModal>
              <MenuItem onClick={() => setSelectionMode(true)} color="red.500">Clear All Chats</MenuItem>
              <MenuDivider />
              <MenuItem onClick={logoutHandler}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Box>

      {selectionMode && (
        <Box p="10px 16px" bg="#00a884" color="white" d="flex" justifyContent="space-between" alignItems="center">
          <Flex alignItems="center">
            <IconButton
              icon={<MdClose />}
              variant="ghost"
              color="white"
              onClick={() => {
                setSelectionMode(false);
                setSelectedChats([]);
              }}
              mr={2}
            />
            <Text fontWeight="semibold">{selectedChats.length} selected</Text>
          </Flex>
          <IconButton
            icon={<MdDelete />}
            variant="ghost"
            color="white"
            fontSize="22px"
            onClick={deleteSelectedChats}
            isDisabled={selectedChats.length === 0}
          />
        </Box>
      )}

      {/* Search Input - Always Visible */}
      <Box bg={bgColor} borderBottom={`1px solid ${borderColor}`}>
        <Box p="7px 12px">
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color={iconColor} fontSize="xs" />
            </InputLeftElement>
            <Input
              placeholder="Search or start new chat"
              bg={searchBg}
              color={textColor}
              border="none"
              borderRadius="10px"
              fontSize="sm"
              _placeholder={{ color: secondaryTextColor }}
              _focus={{ boxShadow: "none" }}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </InputGroup>
        </Box>
        {/* Search Results - Only show users who don't have existing chats */}
        {loading ? (
          <ChatLoading />
        ) : (
          searchResult
            ?.filter(u => !chats?.find(c =>
              !c.isGroupChat && c.users.some(chatUser => chatUser._id === u._id)
            ))
            .map((u) => (
              <UserListItem
                key={u._id}
                user={u}
                handleFunction={() => accessChat(u._id)}
              />
            ))
        )}
        {loadingChat && <Spinner ml="auto" d="flex" />}
      </Box>

      {/* Chat List */}
      <Box
        d="flex"
        flexDir="column"
        bg={bgColor}
        w="100%"
        h="100%"
        overflowY="hidden"
      >
        {chats && loggedUser ? (
          <Stack overflowY="scroll" spacing={0} flex={1}>
            {/* Meta AI / Xerah Bot Entry */}
            <Box
              onClick={() => {
                setSelectedChat({
                  _id: "xerah_bot",
                  chatName: "Xerah AI",
                  isGroupChat: false,
                  users: [{ name: "Xerah", pic: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Meta_AI_logo.svg", _id: "bot" }]
                });
              }}
              cursor="pointer"
              bg={selectedChat?._id === "xerah_bot" ? selectedBg : bgColor}
              px={3}
              py={3}
              borderBottom={`1px solid ${borderColor}`}
              _hover={{ bg: hoverBg }}
              d="flex"
              alignItems="center"
            >
              <Box
                mr={3}
                w="45px"
                h="45px"
                borderRadius="full"
                bg="linear-gradient(45deg, #00f2fe 0%, #4facfe 100%)"
                d="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Box w="20px" h="20px" borderRadius="full" border="3px solid white" />
              </Box>
              <Box flex={1}>
                <Flex justifyContent="space-between" alignItems="center">
                  <Text fontWeight="semibold" fontSize="md" color={textColor}>
                    Xerah AI
                  </Text>
                </Flex>
                <Text fontSize="sm" color="#00a884" fontWeight="500">
                  Ask me anything...
                </Text>
              </Box>
            </Box>

            {chats
              .filter(chat =>
                !search ||
                (chat.isGroupChat
                  ? chat.chatName.toLowerCase().startsWith(search.toLowerCase())
                  : getSender(loggedUser, chat.users).toLowerCase().startsWith(search.toLowerCase()))
              )
              .map((chat) => (
                <Box
                  onClick={() => selectionMode ? toggleChatSelection(chat._id) : setSelectedChat(chat)}
                  cursor="pointer"
                  bg={(selectedChat?._id === chat._id && !selectionMode) ? selectedBg : (selectionMode && selectedChats.includes(chat._id)) ? hoverBg : bgColor}
                  px={3}
                  py={3}
                  key={chat._id}
                  borderBottom={`1px solid ${borderColor}`}
                  _hover={{ bg: hoverBg }}
                  d="flex"
                  alignItems="center"
                >
                  {selectionMode && (
                    <Checkbox
                      isChecked={selectedChats.includes(chat._id)}
                      colorScheme="teal"
                      mr={3}
                      onChange={() => toggleChatSelection(chat._id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <Avatar
                    mr={3}
                    size="md"
                    cursor="pointer"
                    name={chat.isGroupChat ? chat.chatName : getSender(loggedUser, chat.users)}
                    src={chat.isGroupChat ? "" : getSenderFull(loggedUser, chat.users).pic}
                  />
                  <Box flex={1}>
                    <Flex justifyContent="space-between" alignItems="center">
                      <Text fontWeight="semibold" fontSize="md" color={textColor}>
                        {!chat.isGroupChat
                          ? getSender(loggedUser, chat.users)
                          : chat.chatName}
                      </Text>
                      {notification.filter((n) => n.chat?._id === chat._id).length > 0 && (
                        <Box
                          bg="#25D366"
                          color="white"
                          borderRadius="full"
                          minW="20px"
                          h="20px"
                          d="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="xs"
                          fontWeight="bold"
                          px={1.5}
                        >
                          {notification.filter((n) => n.chat?._id === chat._id).length}
                        </Box>
                      )}
                    </Flex>
                    {typingChats[chat._id] ? (
                      <Text fontSize="sm" color="#00a884" fontStyle="italic">
                        typing...
                      </Text>
                    ) : chat.latestMessage ? (
                      <Flex alignItems="center">
                        {chat.latestMessage.sender?._id === user?._id && (
                          <Box mr={1}>
                            <IoCheckmarkDoneSharp
                              size="14px"
                              color={chat.latestMessage.readBy?.some(id => id !== user?._id) ? "#53bdeb" : secondaryTextColor}
                            />
                          </Box>
                        )}
                        <Text fontSize="sm" color={secondaryTextColor} noOfLines={1}>
                          {chat.latestMessage.content?.startsWith("data:image") ? "📷 Photo" :
                            chat.latestMessage.content?.startsWith("data:video") ? "🎥 Video" :
                              chat.latestMessage.content?.startsWith("data:audio") ? "🎵 Audio" :
                                chat.latestMessage.content?.startsWith("https://maps.google.com") ? "📍 Location" :
                                  chat.latestMessage.content}
                        </Text>
                      </Flex>
                    ) : (
                      <Text fontSize="sm" color={secondaryTextColor} fontStyle="italic">
                        Tap to start chatting
                      </Text>
                    )}
                  </Box>
                </Box>
              ))}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>

      {/* Xerah AI Floating Button with Animated Popup */}
      <Box
        position="absolute"
        bottom="20px"
        right="20px"
        zIndex={10}
        className="xerah-button-container"
        onMouseEnter={() => setShowXerahPopup(true)}
        onMouseLeave={() => setShowXerahPopup(false)}
      >
        {/* Animated Bubbles */}
        {showXerahPopup && (
          <>
            <Box className="xerah-bubble" />
            <Box className="xerah-bubble" />
            <Box className="xerah-bubble" />
          </>
        )}

        {/* Popup Tooltip */}
        {showXerahPopup && (
          <Box
            className="xerah-popup"
            position="absolute"
            right="60px"
            bottom="10px"
            bg={bgColor}
            borderRadius="12px"
            p="10px 14px"
            boxShadow="0 4px 20px rgba(0,0,0,0.15)"
            whiteSpace="nowrap"
            border="1px solid"
            borderColor={borderColor}
          >
            <Flex alignItems="center">
              <Text fontSize="xl" mr={2}>🤖</Text>
              <Text fontSize="sm" fontWeight="500" color={textColor}>
                Ask me anything
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </Text>
            </Flex>
            {/* Speech bubble arrow */}
            <Box
              position="absolute"
              right="-8px"
              bottom="12px"
              w="0"
              h="0"
              borderTop="8px solid transparent"
              borderBottom="8px solid transparent"
              borderLeft={`8px solid ${bgColor}`}
            />
          </Box>
        )}

        {/* Main Button */}
        <IconButton
          className="xerah-button"
          w="50px"
          h="50px"
          borderRadius="full"
          bg="linear-gradient(45deg, #00f2fe 0%, #4facfe 100%)"
          icon={<Box w="24px" h="24px" borderRadius="full" border="4px solid white" />}
          transition="all 0.2s"
          boxShadow="lg"
          onClick={() => {
            setSelectedChat({
              _id: "xerah_bot",
              chatName: "Xerah AI",
              isGroupChat: false,
              users: [{ name: "Xerah", pic: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Meta_AI_logo.svg", _id: "bot" }]
            });
          }}
        />
      </Box>
    </Box >
  );
};

export default MyChats;

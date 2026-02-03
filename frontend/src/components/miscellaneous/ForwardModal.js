import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    useDisclosure,
    FormControl,
    Input,
    useToast,
    Box,
    Stack,
    Text,
    Avatar,
    Divider,
} from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { ChatState } from "../../Context/ChatProvider";
import { getSender } from "../../config/ChatLogics";

const ForwardModal = ({ children, content, isOpen: externalIsOpen, onClose: externalOnClose }) => {
    const { isOpen: internalIsOpen, onOpen, onClose: internalOnClose } = useDisclosure();

    // Use external or internal control
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    const onClose = externalOnClose !== undefined ? externalOnClose : internalOnClose;

    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const { user, chats, playNotificationSound } = ChatState();
    const toast = useToast();

    const handleSearch = async (query) => {
        if (!query) {
            setSearchResults([]);
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
            setSearchResults(data);
            setLoading(false);
        } catch (error) {
            toast({
                title: "Error Occurred!",
                description: "Failed to Load the Search Results",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-left",
            });
        }
    };

    const forwardMessage = async (chat) => {
        try {
            const config = {
                headers: {
                    "Content-type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };

            // Since the backend 'accessChat' handles both finding and creating chats
            // We first "access" the chat to make sure it exists in our list
            const { data: chatData } = await axios.post(
                "/api/chat",
                { userId: chat._id },
                config
            );

            await axios.post(
                "/api/message",
                {
                    content: content,
                    chatId: chatData._id,
                },
                config
            );

            playNotificationSound();
            toast({
                title: "Message Forwarded",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            onClose();
        } catch (error) {
            toast({
                title: "Error Occurred!",
                description: "Failed to forward the message",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom-right",
            });
        }
    };

    const forwardToExistingChat = async (chat) => {
        try {
            const config = {
                headers: {
                    "Content-type": "application/json",
                    Authorization: `Bearer ${user.token}`,
                },
            };

            await axios.post(
                "/api/message",
                {
                    content: content,
                    chatId: chat._id,
                },
                config
            );

            playNotificationSound();
            toast({
                title: "Message Forwarded",
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            onClose();
        } catch (error) {
            toast({
                title: "Error Occurred!",
                description: "Failed to forward the message",
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "bottom",
            });
        }
    }

    return (
        <>
            {children && <span onClick={onOpen}>{children}</span>}

            <Modal isOpen={isOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader fontSize="20px" d="flex" justifyContent="center">
                        Forward Message
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody d="flex" flexDir="column" alignItems="center">
                        <FormControl mb={4}>
                            <Input
                                placeholder="Search user to forward..."
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </FormControl>

                        <Box w="100%">
                            <Text fontWeight="bold" mb={2} fontSize="sm">Recent Chats</Text>
                            <Stack overflowY="auto" maxH="200px">
                                {chats?.map((chat) => (
                                    <Box
                                        onClick={() => forwardToExistingChat(chat)}
                                        cursor="pointer"
                                        bg="#E8E8E8"
                                        _hover={{
                                            background: "#38B2AC",
                                            color: "white",
                                        }}
                                        w="100%"
                                        d="flex"
                                        alignItems="center"
                                        color="black"
                                        px={3}
                                        py={2}
                                        mb={2}
                                        borderRadius="lg"
                                        key={chat._id}
                                    >
                                        <Avatar
                                            mr={2}
                                            size="sm"
                                            cursor="pointer"
                                            name={chat.isGroupChat ? chat.chatName : getSender(user, chat.users)}
                                            src={chat.isGroupChat ? "" : chat.users.find(u => u._id !== user._id)?.pic}
                                        />
                                        <Box>
                                            <Text fontSize="sm">
                                                {chat.isGroupChat ? chat.chatName : getSender(user, chat.users)}
                                            </Text>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>

                        <Divider my={4} />

                        <Box w="100%">
                            <Text fontWeight="bold" mb={2} fontSize="sm">Search Results</Text>
                            <Stack overflowY="auto" maxH="150px">
                                {loading ? (
                                    <Box>Loading...</Box>
                                ) : (
                                    searchResults?.slice(0, 4).map((u) => (
                                        <Box
                                            onClick={() => forwardMessage(u)}
                                            cursor="pointer"
                                            bg="#E8E8E8"
                                            _hover={{
                                                background: "#38B2AC",
                                                color: "white",
                                            }}
                                            w="100%"
                                            d="flex"
                                            alignItems="center"
                                            color="black"
                                            px={3}
                                            py={2}
                                            mb={2}
                                            borderRadius="lg"
                                            key={u._id}
                                        >
                                            <Avatar
                                                mr={2}
                                                size="sm"
                                                cursor="pointer"
                                                name={u.name}
                                                src={u.pic}
                                            />
                                            <Box>
                                                <Text fontSize="sm">{u.name}</Text>
                                                <Text fontSize="xs">
                                                    <b>Email : </b>
                                                    {u.email}
                                                </Text>
                                            </Box>
                                        </Box>
                                    ))
                                )}
                            </Stack>
                        </Box>
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme="blue" onClick={onClose}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default ForwardModal;

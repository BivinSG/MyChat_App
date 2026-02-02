import { Box, useColorModeValue } from "@chakra-ui/react";
import { useState } from "react";
import Chatbox from "../components/Chatbox";
import MyChats from "../components/MyChats";
import { ChatState } from "../Context/ChatProvider";

const Chatpage = () => {
  const [fetchAgain, setFetchAgain] = useState(false);
  const { user } = ChatState();

  const bgColor = useColorModeValue("#f0f2f5", "#111b21");

  return (
    <div style={{ width: "100%", height: "100vh", backgroundColor: bgColor }}>
      <Box d="flex" justifyContent="space-between" w="100%" h="100%" p="0">
        {user && <MyChats fetchAgain={fetchAgain} />}
        {user && (
          <Chatbox fetchAgain={fetchAgain} setFetchAgain={setFetchAgain} />
        )}
      </Box>
    </div>
  );
};

export default Chatpage;

import {
  Box,
  Container,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { useHistory } from "react-router";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";

// Helper function to validate user data
const isValidUserData = (userData) => {
  if (!userData) return false;
  if (!userData._id || !userData.token) return false;

  // Optional: Check if token is expired (if using JWT)
  try {
    const tokenPayload = JSON.parse(atob(userData.token.split('.')[1]));
    if (tokenPayload.exp && tokenPayload.exp * 1000 < Date.now()) {
      // Token expired, clear sessionStorage
      sessionStorage.removeItem("userInfo");
      return false;
    }
  } catch (e) {
    // If token parsing fails, it might not be a JWT or is invalid
    console.log("Token validation skipped");
  }

  return true;
};

function Homepage() {
  const history = useHistory();

  useEffect(() => {
    try {
      const userInfoStr = sessionStorage.getItem("userInfo");

      // Handle case where sessionStorage returns null or invalid JSON
      if (!userInfoStr) {
        return; // No user, stay on homepage
      }

      const user = JSON.parse(userInfoStr);

      if (isValidUserData(user)) {
        history.push("/chats");
      } else {
        // Invalid user data, clear it
        sessionStorage.removeItem("userInfo");
      }
    } catch (e) {
      // JSON parse error or other issues - clear corrupted data
      console.error("Error reading user info:", e);
      sessionStorage.removeItem("userInfo");
    }
  }, [history]);

  const bgColor = useColorModeValue("#d1d7db", "#0b141a");
  const containerBg = useColorModeValue("white", "#202c33");

  return (
    <Box bg={bgColor} w="100%" h="100vh" position="relative" overflow="hidden">
      <Box bg="#00a884" h="220px" w="100%" position="absolute" top="0" zIndex="0" />
      <Container maxW="xl" centerContent position="relative" zIndex="1">
        <Box
          d="flex"
          justifyContent="center"
          p={3}
          bg="transparent"
          w="100%"
          m="40px 0 15px 0"
        >
          <Text fontSize="4xl" fontFamily="'Pacifico', cursive" color="white" fontStyle="italic">
            Talk-A-Tive
          </Text>
        </Box>
        <Box bg={containerBg} w="100%" p={4} borderRadius="sm" boxShadow="lg" mt={4}>
          <Tabs isFitted variant="soft-rounded">
            <TabList mb="1em">
              <Tab _selected={{ color: "white", bg: "#00a884" }}>Login</Tab>
              <Tab _selected={{ color: "white", bg: "#00a884" }}>Sign Up</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Login />
              </TabPanel>
              <TabPanel>
                <Signup />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Container>
    </Box>
  );
}

export default Homepage;


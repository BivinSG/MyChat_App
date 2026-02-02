import { Avatar } from "@chakra-ui/avatar";
import { Box, Text } from "@chakra-ui/layout";
import { useColorModeValue } from "@chakra-ui/react";

const UserListItem = ({ user, handleFunction }) => {
  const bgColor = useColorModeValue("#f5f6f6", "#2a3942");
  const hoverBg = useColorModeValue("#e9edef", "#3b4a54");
  const textColor = useColorModeValue("black", "#e9edef");
  const borderColor = useColorModeValue("#e2e8f0", "#222e35");

  return (
    <Box
      onClick={handleFunction}
      cursor="pointer"
      bg={bgColor}
      _hover={{
        background: hoverBg,
      }}
      w="100%"
      d="flex"
      alignItems="center"
      color={textColor}
      px={3}
      py={3}
      borderBottom={`1px solid ${borderColor}`}
    >
      <Avatar
        mr={3}
        size="md"
        cursor="pointer"
        name={user.name}
        src={user.pic}
      />
      <Text fontWeight="semibold" fontSize="md">{user.name}</Text>
    </Box>
  );
};

export default UserListItem;



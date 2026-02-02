import { CloseIcon } from "@chakra-ui/icons";
import { Badge, Box } from "@chakra-ui/layout";

const UserBadgeItem = ({ user, handleFunction, admin, showRemove = true }) => {
  const isAdmin = admin?._id === user._id;

  return (
    <Badge
      px={2}
      py={1}
      borderRadius="lg"
      m={1}
      mb={2}
      variant="solid"
      fontSize={12}
      colorScheme={isAdmin ? "teal" : "purple"}
      bg={isAdmin ? "#00a884" : "#805AD5"}
      color="white"
      cursor="pointer"
      onClick={handleFunction}
      display="flex"
      alignItems="center"
      fontWeight={isAdmin ? "bold" : "normal"}
    >
      {isAdmin && <Box as="span" mr={1}>👑</Box>}
      {user.name}
      {isAdmin && <Box as="span" ml={1} fontSize="10px">(Admin)</Box>}
      {showRemove && <CloseIcon pl={1} boxSize={3} />}
    </Badge>
  );
};

export default UserBadgeItem;


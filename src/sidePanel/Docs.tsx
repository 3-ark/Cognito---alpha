import {
 Box, Flex, Text 
} from '@chakra-ui/react';

export const Docs = () => (
  <Box
    background="var(--bg)"
    border="2px"
    borderColor="var(--text)"
    borderRadius={16}
    color="var(--text)"
    cursor="pointer"
    defaultValue="default"
    fontSize="md"
    fontStyle="bold"
    fontWeight={600}
    mr={3}
    pb={0.5}
    pl={3}
    pr={3}
    pt={0.5}
    onClick={() => window.open("https://github.com/3-ark/Bruside/blob/master/DOCS.md", "_blank")}
  >
    <Flex alignItems="center" justifyContent="space-between">
      <Text>0.8.1</Text>
    </Flex>
  </Box>
);

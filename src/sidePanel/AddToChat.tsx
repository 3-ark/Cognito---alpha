import { GoArrowSwitch } from "react-icons/go";
import {
  IconButton, Menu, MenuButton, MenuItem, MenuList, Center, Tooltip
} from '@chakra-ui/react';

import { useConfig } from './ConfigContext';

export const AddToChat = () => {
  const { config, updateConfig } = useConfig();

  return (
    <Menu>
      <Tooltip
        label="Switch Chat Mode"
        placement="top"
        hasArrow
        bg="var(--bg)"
        color="var(--text)"
      >
        <MenuButton
          aria-label="Switch Chat Mode" // Updated aria-label
          as={IconButton}
          borderRadius="md" // Changed to md
          color="var(--text)"
          fontSize="sm"
          fontWeight={800}
          ml={2}
          size="sm"
          variant="ghost"
          _hover={{ bg: "rgba(0, 0, 0, 0.1)" }} // Added hover effect
          zIndex={2}
        >
          <Center>
              {!config?.chatMode && (
                < GoArrowSwitch  color="var(--text)" fontSize="1.25rem" />
              )}
              {config?.chatMode && config.chatMode.toUpperCase()}
          </Center>
        </MenuButton>
      </Tooltip>
      <MenuList
        background="var(--active)"
        border="1px solid var(--text)" // Apply border once here
        borderRadius="md" // Optional: add some rounding
        marginTop="1px"
        height="auto" // Allow height to adjust based on content
        minWidth="auto" // Adjusted minWidth
        p={0} // Remove padding from MenuList itself
        overflow="hidden" // Ensure border radius clips children
        zIndex={2}
        mr="1.5rem" // Adjusted margin to align with button
      >
        <MenuItem
          _hover={{ background: 'var(--bg)' }}
          background={!config?.chatMode ? 'var(--bg)' : 'transparent'} // Use transparent for non-active
          borderBottom="1px solid var(--text)" // Remove individual borders
          color="var(--text)"
          fontSize="md"
          fontWeight={800}
          onClick={() => updateConfig({ chatMode: undefined })}
          display="flex" // Add display flex
          justifyContent="center" // Add justify content center
          py={1} // Add vertical padding
        >
          CHAT
        </MenuItem>
        <MenuItem
          _hover={{ background: 'var(--bg)' }}
          background={config?.chatMode === 'page' ? 'var(--bg)' : 'transparent'}
          borderBottom="1px solid var(--text)"
          color="var(--text)"
          fontSize="md"
          fontWeight={800}
          onClick={() => updateConfig({ chatMode: 'page' })}
          display="flex" // Add display flex
          justifyContent="center" // Add justify content center
          py={1} // Add vertical padding
        >
          PAGE
        </MenuItem>
        <MenuItem
          _hover={{ background: 'var(--bg)' }}
          background={config?.chatMode === 'web' ? 'var(--bg)' : 'transparent'}
          color="var(--text)"
          fontSize="md"
          fontWeight={800}
          onClick={() => updateConfig({ chatMode: 'web' })}
          display="flex" // Add display flex
          justifyContent="center" // Add justify content center
          py={1} // Add vertical padding
        >
          WEB
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

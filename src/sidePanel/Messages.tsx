import { useState } from 'react';
import toast from 'react-hot-toast';
import { CopyIcon, RepeatIcon } from '@chakra-ui/icons';
import { Box, IconButton } from '@chakra-ui/react';
import { motion } from 'framer-motion';

import { ChatMessage } from './ChatHistory';
import { Message } from './Message';

// Define the props interface for better type safety
interface MessagesProps {
  messages?: ChatMessage[];
  isLoading?: boolean;
  onReload?: () => void;
  settingsMode?: boolean;
}

export const Messages: React.FC<MessagesProps> = ({
 messages = [], isLoading = false, onReload = () => {}, settingsMode = false
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(-1);

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy'));
  };

  return (
    <Box
      background="var(--bg)"
      bottom="5rem"
      display="flex"
      flexDir="column-reverse"
      flexGrow={1}
      id="messages"
      marginBottom="-10px"
      marginTop="-20px"
      maxHeight="87vh"
      overflow="scroll"
      paddingBottom="8px"
      paddingTop="5rem"
      position="absolute"
      style={{ opacity: settingsMode ? 0 : 1 }}
    >
      {messages.map(
        (m, i) => m && (

          // but if messages are stable or always appended, it might be acceptable.
          // Consider a more stable key if possible (e.g., a unique ID per message).
          // Removed the unused eslint-disable comment here.
          <Box
            key={`${m}_${i}`} // Reserved prop 'key' comes first
            alignItems="flex-end"
            display="flex"
            justifyContent="flex-start"
            mb={0}
            mt={3}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(-1)}
          >
            <Message i={i} m={m} />
            <Box display="flex" flexDirection="column" gap={1}>
              {/* Sorted props for Copy IconButton */}
              <IconButton
                aria-label="Copy"
                as={motion.div}
                borderRadius={16}
                icon={<CopyIcon color="var(--text)" fontSize="xl" />}
                opacity={hoveredIndex === i ? 1 : 0}
                transition="opacity 0.2s"
                variant="outlined"
                whileHover={{ scale: 1.1, cursor: 'pointer' }}
                onClick={() => copyMessage(m)}
              />
              {i === 0 && (
                <IconButton
                  aria-label="Repeat"
                  as={motion.div}
                  borderRadius={16}
                  icon={<RepeatIcon color="var(--text" fontSize="2xl" />}
                  opacity={hoveredIndex === i ? 1 : 0}
                  transition="opacity 0.2s"
                  variant="outlined"
                  whileHover={{ rotate: '90deg', cursor: 'pointer' }}
                  onClick={onReload}
                />
              )}
            </Box>
          </Box>
        )
      )}
    </Box>
  );
};

// Using TypeScript interface is preferred over PropTypes in TS projects
// Messages.propTypes = {
//   messages: PropTypes.arrayOf(PropTypes.string),
//   isLoading: PropTypes.bool,
//   onReload: PropTypes.func,
//   settingsMode: PropTypes.bool
// };

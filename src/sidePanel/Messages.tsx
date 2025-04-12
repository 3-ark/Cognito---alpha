import toast from 'react-hot-toast';
import { CopyIcon, RepeatIcon } from '@chakra-ui/icons';
import { Box, IconButton } from '@chakra-ui/react';
import { motion } from 'framer-motion';

import { Message } from './Message';

// Define the props interface for better type safety
interface MessagesProps {
  messages?: string[];
  isLoading?: boolean;
  onReload?: () => void;
  settingsMode?: boolean;
}

export const Messages: React.FC<MessagesProps> = ({
 messages = [], isLoading = false, onReload = () => {}, settingsMode = false
}) => {
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
          >
            <Message i={i} m={m} />
            <Box display="flex" flexDirection="column" gap={1}>
              {/* Sorted props for Copy IconButton */}
              <IconButton
                aria-label="Copy"
                as={motion.div}
                borderRadius={16}
                icon={
                  !isLoading && i === 0 ? (
                    <CopyIcon color="var(--text)" fontSize="xl" />
                  ) : undefined
                }
                variant="outlined"
                whileHover={{ scale: 1.1, cursor: 'pointer' }}
                onClick={() => copyMessage(m)}
              />
              {/* Sorted props for Repeat IconButton */}
              <IconButton
                aria-label="Repeat"
                as={motion.div}
                borderRadius={16}
                icon={
                  !isLoading && i === 0 ? (
                    <RepeatIcon
                      color="var(--text)"
                      fontSize="2xl"
                      
                      // Note: onClick was inside the icon definition, moved it to the IconButton prop
                      onClick={onReload}
                    />
                  ) : undefined
                }
                
                // onClick={onReload} // Moved onClick into the icon definition as it seemed intended there
                variant="outlined"
                whileHover={{ rotate: '90deg', cursor: 'pointer' }}
              />
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

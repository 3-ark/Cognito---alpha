import { useState, useLayoutEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { CopyIcon, RepeatIcon } from '@chakra-ui/icons';
import { Box, IconButton } from '@chakra-ui/react';
import { motion } from 'framer-motion';

import { MessageTurn } from './ChatHistory';
import { Message } from './Message';

// Define the props interface for better type safety
interface MessagesProps {
  turns?: MessageTurn[];
  isLoading?: boolean;
  onReload?: () => void;
  settingsMode?: boolean;
}

export const Messages: React.FC<MessagesProps> = ({
 turns = [], isLoading = false, onReload = () => {}, settingsMode = false
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(-1);
    // --- Ref for the scrollable container ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the container itself

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy'));
  };
  // --- Auto-scroll to bottom ---
  useLayoutEffect(() => {
      // Scroll to bottom when turns change, but only if not already scrolled up significantly
      const container = containerRef.current;
      if (container) {
          const isScrolledUp = container.scrollHeight - container.scrollTop > container.clientHeight + 200; // Add buffer
          if (!isScrolledUp && messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
      }
  }, [turns]); // Dependency on turns

  return (
    <Box
      ref={containerRef} // Add ref here
      background="var(--bg)"
      display="flex"
      flexDir="column"
      flexGrow={1}
      id="messages"  
      height="calc(100vh - 10rem)"
      overflowY="scroll"
      paddingBottom="1rem"
      paddingTop="1rem"
      style={{ opacity: settingsMode ? 0 : 1 }}
      width="100%"
    >
      {turns.map(
        (turn, i) => turn && (
          // but if messages are stable or always appended, it might be acceptable.
          // Consider a more stable key if possible (e.g., a unique ID per message).
          <Box
            key={turn.timestamp || `turn_${i}`} // Use timestamp if available, fallback to index
            alignItems="flex-end"
            display="flex"
            justifyContent={turn.role === 'user' ? 'flex-start' : 'flex-end'} // Align user right, assistant left
            mb={0}
            mt={3}
            width="100%"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(-1)}
          >
            <Message turn={turn} index={i} />
            <Box display="flex" flexDirection="column" gap={1} ml={1}>
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
                onClick={() => copyMessage(turn.rawContent)}
              />
              {i === turns.length - 1 && turn.role === 'assistant' && ( // Check if it's the last turn AND assistant
                <IconButton
                  aria-label="Repeat"
                  as={motion.div}
                  borderRadius={16}
                  icon={<RepeatIcon color="var(--text)" fontSize="2xl" />}
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
      <div ref={messagesEndRef} />
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

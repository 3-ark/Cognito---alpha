import { IconButton, Spinner } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { TbSend } from "react-icons/tb";

export const Send = ({ isLoading, onSend }: { isLoading: boolean, onSend: () => void }) => (
  <IconButton
    aria-label="Send"
    as={motion.div}
    borderRadius="md" // Changed to md
    icon={
      isLoading ? (
        <Spinner color="var(--text)" speed="2s" />
      ) : (
        <TbSend color="var(--text)" fontSize="16px" /> // Adjusted size slightly for consistency
      )
    }
    ml={2}
    mr={2}
    size="sm"
    variant="ghost"
    _hover={{ bg: !isLoading ? "rgba(0, 0, 0, 0.1)" : undefined }} // Unified hover effect
    zIndex={2}
    onClick={onSend}
    // Removed pb, pt, minWidth, transform to rely on size="sm" defaults
    isDisabled={isLoading || !('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)}
    />
);

// src/sidePanel/Messages.tsx
import { useState, useLayoutEffect, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiCopy, FiRepeat, FiPlay, FiPause, FiSquare } from 'react-icons/fi';
import { Box, IconButton, VStack } from '@chakra-ui/react';
import { MessageTurn } from './ChatHistory';
import { EditableMessage } from './Message'; // Rename import for clarity if Message becomes EditableMessage internally
import {
  speakMessage,
  stopSpeech,
  pauseSpeech,
  resumeSpeech,
  isCurrentlySpeaking,
  isCurrentlyPaused,
} from '../background/ttsUtils';
import { useConfig } from './ConfigContext';

// --- Helper Function to Clean Text for TTS ---
const cleanTextForTTS = (text: string): string => {
  let cleanedText = text;
  // 1. Remove markdown emphasis (bold/italic) - Keep this
  cleanedText = cleanedText.replace(/(\*\*|__|\*|_)(.*?)\1/g, '$2');

  // 2. Remove list markers at the start of lines - Keep this
  cleanedText = cleanedText.replace(/^[*+-]\s+/gm, '');

  // 3. Remove any remaining asterisks (that weren't part of emphasis/lists)
  cleanedText = cleanedText.replace(/\*/g, ''); // Added this line

  // 4. Remove all colons entirely (instead of replacing with period)
  cleanedText = cleanedText.replace(/:/g, '.'); // Changed this line

  // 5. Replace slashes with spaces - Keep this
  cleanedText = cleanedText.replace(/\//g, ' ');

  // 6. Collapse multiple spaces into one - Keep this
  cleanedText = cleanedText.replace(/\s{2,}/g, ' ');

  // 7. Trim whitespace from start/end - Keep this
  return cleanedText.trim();
};
// --- End Helper Function ---

interface MessagesProps {
  turns?: MessageTurn[];
  isLoading?: boolean;
  onReload?: () => void;
  settingsMode?: boolean;
  onEditTurn: (index: number, newContent: string) => void; // Add prop for editing
}

export const Messages: React.FC<MessagesProps> = ({
  turns = [], isLoading = false, onReload = () => {}, settingsMode = false, onEditTurn // Destructure new prop
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const [editingIndex, setEditingIndex] = useState<number | null>(null); // State for which message is being edited
  const [editText, setEditText] = useState<string>(''); // State for the text being edited

  const [speakingIndex, setSpeakingIndex] = useState<number>(-1);
  const [ttsIsPaused, setTtsIsPaused] = useState<boolean>(false);
  const { config } = useConfig();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to update local pause state based on global state (keep as is)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentlyPaused = isCurrentlyPaused();
      const currentlySpeaking = isCurrentlySpeaking();

      if (!currentlySpeaking && speakingIndex !== -1) {
        setSpeakingIndex(-1);
        setTtsIsPaused(false);
      }
      else if (currentlySpeaking && ttsIsPaused !== currentlyPaused) {
        setTtsIsPaused(currentlyPaused);
      }
      else if (currentlyPaused && speakingIndex === -1) {
         setTtsIsPaused(true);
      }

    }, 250);

    return () => clearInterval(interval);
  }, [speakingIndex, ttsIsPaused]);

  const copyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard'))
      .catch(() => toast.error('Failed to copy'));
  };

  // --- TTS Handlers (keep as is) ---
  const handlePlay = (index: number, text: string) => {
    console.log(`Attempting to play index: ${index}`);
    const textToSpeak = cleanTextForTTS(text);
    console.log(`Cleaned text for TTS: "${textToSpeak}"`);

    speakMessage(textToSpeak, config?.tts?.selectedVoice, config?.tts?.rate, { // Pass config.tts.rate here
      onStart: () => {
        console.log(`Speech started for index: ${index}`);
        setSpeakingIndex(index);
        setTtsIsPaused(false);
      },
      onEnd: () => {
        console.log(`Speech ended for index: ${index}`);
        if (speakingIndex === index) {
            setSpeakingIndex(-1);
            setTtsIsPaused(false);
        }
      },
      onPause: () => {
        console.log(`Speech paused for index: ${index}`);
         if (speakingIndex === index) {
            setTtsIsPaused(true);
         }
      },
      onResume: () => {
        console.log(`Speech resumed for index: ${index}`);
         if (speakingIndex === index) {
            setTtsIsPaused(false);
         }
      },
    });
  };

  const handlePause = () => {
    console.log("Handle pause called");
    pauseSpeech();
  };

  const handleResume = () => {
    console.log("Handle resume called");
    resumeSpeech();
  };

  const handleStop = () => {
    console.log("Handle stop called");
    stopSpeech();
    setSpeakingIndex(-1);
    setTtsIsPaused(false);
  };
  // --- End TTS Handlers ---

  // --- Edit Handlers ---
  const startEdit = (index: number, currentContent: string) => {
    setEditingIndex(index);
    setEditText(currentContent);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditText('');
  };

  const saveEdit = () => {
    if (editingIndex !== null && editText.trim()) { // Ensure there's an index and non-empty text
      onEditTurn(editingIndex, editText);
    }
    cancelEdit(); // Exit editing mode regardless
  };
  // --- End Edit Handlers ---


  // --- Revised useLayoutEffect for Scrolling ---
  useLayoutEffect(() => {
    const container = containerRef.current;
    // We don't strictly need the endRef element itself if we use scrollTop

    if (container) {
      // Calculate distance from bottom BEFORE potential scroll adjustment
      // scrollHeight: total height of the scrollable content
      // scrollTop: how far down the user has scrolled from the top
      // clientHeight: the visible height of the container
      const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

      // Define a threshold (e.g., 200 pixels)
      // Only auto-scroll if the user is already near the bottom
      const isNearBottom = scrollBottom < 200;

      // console.log(`Scroll Info: scrollHeight=${container.scrollHeight}, scrollTop=${container.scrollTop}, clientHeight=${container.clientHeight}, scrollBottom=${scrollBottom}, isNearBottom=${isNearBottom}`);

      if (isNearBottom) {
        // Directly set scrollTop to the maximum value (scroll to bottom)
        // This happens synchronously after DOM update but before paint,
        // aiming to prevent the user from seeing the pre-scroll state.
        // This might be less smooth than scrollIntoView but can prevent jumps.
        container.scrollTop = container.scrollHeight;

        // --- Alternative: If the jump persists, try smooth scroll again ---
        // messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        // --- Alternative 2: If smooth scroll causes jumps, try 'auto' (instant) ---
        // messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
      }
      // If the user has scrolled up significantly (isNearBottom is false),
      // we don't auto-scroll, preserving their position.
    }
  }, [turns]); // Dependency array: Re-run this effect when the 'turns' array changes.

  return (
    <Box
      ref={containerRef}
      background={config?.paperTexture ? 'transparent' : 'var(--bg)'} // Conditionally set background
      display="flex"
      flexDir="column"
      flexGrow={1}
      id="messages"
      height="calc(100dvh - 8rem)"
      overflowY="scroll"
      paddingBottom="1rem"
      paddingTop="1rem"
      style={{ opacity: settingsMode ? 0 : 1 }}
      width="100%"
      sx={{
        '&::-webkit-scrollbar': { width: '8px' },
        '&::-webkit-scrollbar-track': { background: 'var(--bg)' },
        '&::-webkit-scrollbar-thumb': { background: 'var(--text-secondary)', borderRadius: '4px' },
        '&::-webkit-scrollbar-thumb:hover': { background: 'var(--text)' },
      }}
    >
      {turns.map(
        (turn, i) => turn && (
          // Message rendering logic remains the same
          <Box
            key={turn.timestamp || `turn_${i}`}
            alignItems="flex-start"
            display="flex"
            justifyContent={turn.role === 'user' ? 'flex-start' : 'flex-end'}
            mb={0}
            mt={2}
            width="100%"
            px={2} // Add some horizontal padding so shadow isn't clipped
            position="relative"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(-1)}
          >
            {/* Assistant Controls (Left Side) */}
            {turn.role === 'assistant' && (
              <VStack
                spacing={0}
                mr={1}
                opacity={(hoveredIndex === i || speakingIndex === i) ? 1 : 0}
                transition="opacity 0.2s"
                alignSelf="flex-end"
                alignItems="center"
                pb={3}
              >
                {/* Only show copy button if not editing */}
                {editingIndex !== i && (
                  <IconButton aria-label="Copy" size="sm" variant="ghost" icon={<FiCopy color="var(--text)" />} onClick={() => copyMessage(turn.rawContent)} title="Copy message" />
                )}
                {speakingIndex === i ? (
                  ttsIsPaused ? (
                    <IconButton aria-label="Resume" size="sm" variant="ghost" icon={<FiPlay color="var(--text)" />} onClick={handleResume} title="Resume speech" />
                  ) : (
                    <IconButton aria-label="Pause" size="sm" variant="ghost" icon={<FiPause color="var(--text)" />} onClick={handlePause} title="Pause speech" />
                  )
                ) : (
                  <IconButton aria-label="Speak" size="sm" variant="ghost" icon={<FiPlay color="var(--text)" />} onClick={() => handlePlay(i, turn.rawContent)} title="Speak message" />
                )}
                 {speakingIndex === i && (
                    <IconButton aria-label="Stop" size="sm" variant="ghost" icon={<FiSquare color="var(--text)" />} onClick={handleStop} title="Stop speech" />
                 )}
                {i === turns.length - 1 && (
                  <IconButton aria-label="Reload" size="sm" variant="ghost" icon={<FiRepeat color="var(--text)" />} onClick={onReload} title="Reload last prompt" />
                )}
              </VStack>
            )}

            {/* The Message Bubble */}
            <EditableMessage // Use the potentially renamed component
              turn={turn}
              index={i}
              isEditing={editingIndex === i}
              editText={editText}
              onStartEdit={startEdit}
              onSetEditText={setEditText}
              onSaveEdit={saveEdit}
              onCancelEdit={cancelEdit} />

            {/* User Controls (Right Side) */}
            {turn.role === 'user' && (
              <VStack
                spacing={0}
                ml={1}
                opacity={hoveredIndex === i ? 1 : 0}
                transition="opacity 0.2s"
                alignSelf="flex-end"
                alignItems="center"
                pb={1}
              >
                {/* Only show copy button if not editing */}
                {editingIndex !== i && (
                  <IconButton aria-label="Copy" size="sm" variant="ghost" icon={<FiCopy color="var(--text)" />} onClick={() => copyMessage(turn.rawContent)} title="Copy message" />
                )}
              </VStack>
            )}
          </Box>
        )
      )}
      {/* Div used for scrolling calculations (keep ref, even if not using scrollIntoView) */}
      <div ref={messagesEndRef} style={{ height: '1px' }} />
    </Box>
  );
};

import React, {
 ForwardedRef, useEffect, useRef, useState, useCallback 
} from 'react';
import ResizeTextarea from 'react-textarea-autosize';
import { Box, Textarea, IconButton, Tooltip, useToast } from '@chakra-ui/react';
import { FaRegStopCircle } from 'react-icons/fa'; // Import mic icons
import { useConfig } from './ConfigContext';
import { SlMicrophone } from "react-icons/sl";

export const AutoResizeTextarea = React.forwardRef((props, ref) => (
  <Textarea
    ref={ref as ForwardedRef<HTMLTextAreaElement>}
    as={ResizeTextarea}
    maxRows={8}
    minH="unset"
    minRows={1}
    overflow="scroll"
    resize="none"
    w="100%"
    {...props}
    p={1}
  />
));
AutoResizeTextarea.displayName = 'AutoResizeTextarea';


interface InputProps {
    isLoading: boolean;
    message: string;
    setMessage: (message: string) => void;
    onSend: () => void;
    // Add any other props if needed
}

export const Input: React.FC<InputProps> = ({ isLoading, message, setMessage, onSend }) => {
const { config } = useConfig();
const ref = useRef<HTMLTextAreaElement>(null);
const [isListening, setIsListening] = useState(false);
const toast = useToast(); // For showing errors

// Use a ref to ensure we always have the latest setMessage without causing effect re-runs
const setMessageRef = useRef(setMessage);
useEffect(() => {
  setMessageRef.current = setMessage;
}, [setMessage]);


  useEffect(() => {
    ref.current?.focus();
  }, [message, config?.chatMode]);

const placeholder = config?.chatMode === 'web' ? 'what to search?' : config?.chatMode === 'page' ? 'about the page..' : '';

const recognitionRef = useRef<SpeechRecognition | null>(null);

const handleListen = useCallback(async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setMessageRef.current(prev => prev + transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      toast({
        title: 'Speech Error',
        description: event.error,
        status: 'error',
        duration: 2000,
      });
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  } catch (err) {
    console.error('Mic access error:', err);
    toast({
      title: 'Microphone access needed',
      description: 'Please allow access to the microphone in your browser settings.',
      status: 'error',
      duration: 2000
    });
  }
}, []);

// this function is not used in the current code, because this function is not functional well. but maybe later
// const handleStop = () => {
//   recognitionRef.current?.stop();
//   recognitionRef.current = null;
//   setIsListening(false);
// };


useEffect(() => {
  return () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };
}, []);

  return (    
  <Box ml={2} position="relative" width="100%" display="flex" alignItems="center">
      <Tooltip
        label={isListening ? "Stop Listening" : "Start Listening"}
        placement="top"
        hasArrow
        bg="var(--bg)"      // Added style
        color="var(--text)" // Added style
      >
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            handleListen();
          }}
          aria-label={isListening ? "Stop Listening" : "Start Listening"}
          icon={isListening ? <FaRegStopCircle /> : <SlMicrophone />}
          variant="ghost"
          size="sm"
          borderRadius="md" // Added for consistency
          mr={2}
          color={isListening ? "red.500" : "var(--text)"} // Change color based on listening state
          isDisabled={isLoading || !(window.SpeechRecognition || window.webkitSpeechRecognition)}
          _hover={{ bg: 'rgba(0, 0, 0, 0.1)' }} // Unified hover effect
        />
      </Tooltip>

      <AutoResizeTextarea
        ref={ref}
        _focus={{
          borderColor: 'var(--text)',
          boxShadow: 'none !important'
        }}
        _hover={{
          borderColor: 'var(--text)',
          boxShadow: 'none !important'
        }}
        autoComplete="off"
        background="var(--bg)"
        border="1px"
        borderColor="var(--text)"
        borderRadius={16}
        color="var(--text)"
        fontSize="md"
        fontStyle="bold"
        fontWeight={600}
        id="user-input"
        placeholder={placeholder}
        position="relative"
        size="lg"
        value={message}
        width="100%"
        zIndex={1}
        autoFocus
        onChange={event => setMessage(event.target.value)}
        onKeyDown={event => {
          if (isLoading) return;

          if (event.keyCode === 13 && message && !event.altKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            event.stopPropagation();
            onSend();
            setMessage('');
          }
        }}
        sx={{
          // Use a specific pixel value for precise control inside the textarea
          paddingLeft: '3',
          paddingRight: '3' // Adjust this value (e.g., '18px', '20px') as needed
        }}
      />
    </Box>
  );
};

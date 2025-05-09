import { useEffect, useState } from 'react';
import {
 Box,IconButton, Text 
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiTrash2 } from 'react-icons/fi'; // Import the new icon
import localforage from 'localforage';

const dateToString = date => new Date(date).toLocaleDateString('sv-SE');

// In ChatHistory.tsx or a shared types file

export interface MessageTurn {
  role: 'user' | 'assistant';
  status: 'complete' | 'streaming' | 'error';
  rawContent: string;         // The actual text from user or LLM
  webDisplayContent?: string; // Stores the "**SUB:**..." or "**ORG:**..." part for assistant messages
  timestamp: number;          // Timestamp for this specific turn (useful for keys)
}

// Updated ChatMessage structure for storing sessions
export type ChatMessage = {
  id: string;
  last_updated: number;
  title?: string;
  model?: string;
  turns: MessageTurn[];
}

type ChatHistoryProps = {
  loadChat: (chat: ChatMessage) => void;
  onDeleteAll: () => void;
};

declare global {
  interface Window {
    deleteAllChats: () => void;
  }
}

export const ChatHistory = ({ loadChat, onDeleteAll }: ChatHistoryProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hoverId, setHoverId] = useState('');
  const [removeId, setRemoveId] = useState('');

  const messagesWithDates = messages.map(message => ({
    ...message,
    date: dateToString(message.last_updated)
  }));

  const uniqueDates = Array.from(
    new Set(messagesWithDates.map(message => message.date))
  );

  useEffect(() => {
    localforage.keys().then(async keys => {
      const storedMessages = await Promise.all(keys.map(key => localforage.getItem(key))) as ChatMessage[];

      setMessages(storedMessages.sort((a, b) => b.last_updated - a.last_updated));
    });
  }, []);

  const deleteMessage = (id: string) => {
    localforage.removeItem(id).then(async () => {
      localforage.keys().then(async keys => {
        const storedMessages = await Promise.all(keys.map(key => localforage.getItem(key))) as ChatMessage[];

        setMessages(storedMessages.sort((a, b) => b.last_updated - a.last_updated));
      });
    });
  };

  const deleteAll = async () => {
    const keys = await localforage.keys();

    await Promise.all(keys.map(key => localforage.removeItem(key)));
    setMessages([]);

    if (onDeleteAll) onDeleteAll();  // Call parent callback if provided
  };

  useEffect(() => {
    window.deleteAllChats = deleteAll;
  }, []);

  return (
    <Box
      height="100%"
      overflowX="hidden"
      overflowY="scroll"
      position="absolute"
      pt="5rem"
      top="0rem"
      width="100%"
    >
      {uniqueDates.map(date => (
        <Box key={date} mb="2rem">
          <Text
            color="var(--text)"
            fontSize="xl"
            fontWeight={800}
            overflow="hidden"
            paddingLeft="1rem"
            pb={1}
            textAlign="left"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            width="90%"
          >
            {date === dateToString(new Date()) ? 'today' : date}
          </Text>
          {messagesWithDates.filter(m => m.date === date).map(message => (
            <Box
              key={message.id}
              alignItems="center"
              display="flex"
              onMouseEnter={() => setHoverId(message.id)}
              onMouseLeave={() => setHoverId('')}
            >
              <Text
                color="var(--text)"
                cursor="pointer"
                fontSize="lg"
                fontWeight={400}
                paddingLeft="1rem"
                width="4.5rem"
              >
                {(`0${(new Date(message.last_updated)).getHours()}`).slice(-2)}
                :
                {(`0${(new Date(message.last_updated)).getMinutes()}`).slice(-2)}

              </Text>
              <Text
                _hover={{
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px',
                  textDecorationThickness: '2px'
                }}
                color="var(--text)"
                cursor="pointer"
                fontSize="lg"
                fontWeight={800}
                overflow="hidden"
                paddingBottom="0.5rem"
                paddingLeft="1rem"
                paddingTop="0.5rem"
                textAlign="left"
                textDecoration={message.id === removeId ? 'line-through' : undefined}
                textDecorationThickness="2px"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                width="75%"
                onClick={() => loadChat(message)}
              >
                {message.title}
              </Text>
              {
                message.id === hoverId && (
                  <IconButton
                    aria-label="Reset"
                    as={motion.div}
                    borderRadius={16}
                    icon={<FiTrash2 size="18px" color="var(--text)" />} // Use FiTrash2 here
                    variant="outlined"
                    whileHover={{ rotate: '15deg', cursor: 'pointer' }}
                    onClick={() => deleteMessage(message.id)}
                    onMouseEnter={() => setRemoveId(message.id)}
                    onMouseLeave={() => setRemoveId('')}
                  />
                )
              }
            </Box>
          ))}
        </Box>
      ))}

    </Box>
  );
};

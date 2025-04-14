import { useEffect, useState } from 'react';
import { toast,Toaster } from 'react-hot-toast';
import {
  Box,
  Container,
  useInterval
} from '@chakra-ui/react';
import localforage from 'localforage';

import { useChatTitle } from './hooks/useChatTitle';
import useSendMessage from './hooks/useSendMessage';
import { useUpdateModels } from './hooks/useUpdateModels';
import { AddToChat } from './AddToChat';
import { Background } from './Background';
import { ChatHistory, ChatMessage } from './ChatHistory';  // Remove deleteAll from import
import { useConfig } from './ConfigContext';
import { Header } from './Header';
import { Input } from './Input';
import { Messages } from './Messages';
import {
 downloadImage, downloadJson, downloadText 
} from './messageUtils';
import { Send } from './Send';
import { Settings } from './Settings';
import { setTheme, themes } from './Themes';

function bridge() {
  // Collect image alt texts
  const altTexts = Array.from(document.images)
    .map(img => img.alt)
    .filter(alt => alt.trim().length > 0)
    .join('. ');

  // Extract table contents
  const tableData = Array.from(document.querySelectorAll('table'))
    .map(table => table.innerText.replace(/\s\s+/g, ' '))
    .join('\n');

  const response = JSON.stringify({
    title: document.title,
    text: document.body.innerText.replace(/\s\s+/g, ' '),
    html: document.body.innerHTML.replace(/\s\s+/g, ' '),
    
    // New fields
    altTexts,
    tableData,
    meta: {
      description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
      keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content')
    }
  });

  return response;
}

// Modify the injectBridge function
async function injectBridge() {
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  
  // Add early return for restricted URLs
  if (!tab?.id || tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
    console.debug('Skipping injection for restricted URL:', tab?.url);

    return;
  }

  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: bridge
    });
    const res = JSON.parse(result?.[0]?.result || '{}');

    try {
      localStorage.setItem('pagestring', JSON.stringify(res?.text || ''));
      localStorage.setItem('pagehtml', JSON.stringify(res?.html || ''));
      localStorage.setItem('alttexts', JSON.stringify(res?.altTexts || ''));
      localStorage.setItem('tabledata', JSON.stringify(res?.tableData || ''));
    } catch (err) {
      console.debug('localStorage error:', err);
    }
  } catch (err) {
    console.debug('Script injection failed:', err);
  }
}

const generateChatId = () => `chat_${Math.random().toString(16).slice(2)}`;
 
const MessageTemplate = ({ children, onClick }) => (
  <Box
    background="var(--active)"
    border="2px solid var(--text)"
    borderRadius={14}
    color="var(--text)"
    cursor="pointer"
    display="grid"
    fontSize="md"
    fontWeight={800}
    mb={2}
    p={0}
    pl={1}
    placeItems="center"
    position="relative"
    pr={1}
    sx={{
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(assets/images/paper-texture.png)',
        backgroundSize: '512px',
        opacity: 0.3,
        pointerEvents: 'none',
        borderRadius: '14px',
        mixBlendMode: 'multiply',
        zIndex: 0
      }
    }}
    textAlign={'center'}
    width="10ch"
    onClick={onClick}
  >
    {children}
  </Box>
);

const Bruside = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [chunk, setChunk] = useState('');
  const [chatId, setChatId] = useState(generateChatId());
  const [response, setResponse] = useState('');
  const [webContent, setWebContent] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [settingsMode, setSettingsMode] = useState(false);
  const [historyMode, setHistoryMode] = useState(false);
  const { config, updateConfig } = useConfig();

  useInterval(async () => {
    if (config?.chatMode === 'page') {
      await injectBridge(); // Re-injects content script periodically
    }
  }, 2000);

  const { chatTitle, setChatTitle } = useChatTitle(isLoading, messages, message);

  const onSend = useSendMessage(isLoading, message, messages, webContent, config, setMessages, setMessage, setResponse, setWebContent, setPageContent, setLoading);

  useUpdateModels();

  const reset = () => {
    setMessages([]);
    setPageContent('');
    setWebContent('');
    setLoading(false);
    updateConfig({ chatMode: undefined });
    setChunk('');
    setMessage('');
    setChatTitle('');
    setChatId(generateChatId());
    setHistoryMode(false); // Add this
  };

  const onReload = () => {
    setMessages(messages.slice(2));
    setMessage(messages[1]);
  };

  // load stored theme
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'moss';

    setTheme(themes.find(({ name }) => name === theme) || themes[0]);
    updateConfig({ chatMode: undefined })
  }, []);

  useEffect(() => {
    if (response) {
      const [, ...others] = messages;

      setMessages([response, ...others]);
    }
  }, [response]);

  const loadChat = (chat: ChatMessage) => {
    setChatTitle(chat.title || '');
    setMessages(chat.messages); 
    setChatId(chat.id);
    setHistoryMode(false);
  };

  useEffect(() => {
    if (messages.length && !isLoading) {
      const savedChat = {
        id: chatId,
        last_updated: Date.now(),
        title: chatTitle || messages[messages.length - 1],
        messages
      };

      // Remove the existingChat check and always save the latest chat state
      localforage.setItem(chatId, savedChat);
    }
  }, [chatId, messages, isLoading, chatTitle]);

  const deleteAll = async () => {
    const keys = await localforage.keys();

    await Promise.all(keys.map(key => localforage.removeItem(key)));
    setMessages([]);
    setPageContent('');
    setWebContent('');
    setLoading(false);
    setChunk('');
    setMessage('');
    setChatTitle('');
    setChatId(generateChatId());
    setHistoryMode(false); // Add this line to exit history mode
    updateConfig({ chatMode: undefined }); // Add this line to reset chat mode
  };

  // Add this useEffect
  useEffect(() => {
    const handlePanelOpen = async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      
      if (tab?.id) {
        await injectBridge();
        chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_CONTENT' });
      }
    };

    handlePanelOpen();
    
    return () => {
      // Clear cached content when panel closes
      localStorage.removeItem('pagestring');
      localStorage.removeItem('pagehtml');
    };
  }, []);

  return (
    <Container
      maxWidth="100%"
      minHeight="100vh"
      padding={0}
      textAlign="center"
    >
      <Box
        display="flex"
        flexDir="column"
        justifyContent="space-between"
        minHeight="100vh"
      >
        <Header
          chatTitle={chatTitle}
          deleteAll={deleteAll}  // Pass the local deleteAll function
          downloadImage={() => downloadImage(messages)}
          downloadJson={() => downloadJson(messages)}
          downloadText={() => downloadText(messages)}
          historyMode={historyMode}
          reset={reset}
          setHistoryMode={setHistoryMode}
          setSettingsMode={setSettingsMode}
          settingsMode={settingsMode}
        />
        {settingsMode && <Settings />}
        {!settingsMode && !historyMode && messages.length > 0 && (
          <Messages
            isLoading={isLoading}
            messages={messages}
            settingsMode={settingsMode}
            onReload={onReload}
          />
        )}
        {!settingsMode && !historyMode && messages.length === 0 && !config?.chatMode && (
          <Box bottom="4rem" left="0.5rem" position="absolute">
            <MessageTemplate onClick={() => {
              updateConfig({ chatMode: 'web' });
            }}
            >
              Web  {/* Shorter, cleaner */}
            </MessageTemplate>
            <MessageTemplate onClick={() => {
              updateConfig({ chatMode: 'page' });
            }}
            >
              Page  {/* Shorter, cleaner */}
            </MessageTemplate>
          </Box>
        )}
        {!settingsMode && !historyMode && messages.length === 0 && config?.chatMode === "page" && (
          <Box bottom="4rem" left="0.5rem" position="absolute">
            <MessageTemplate onClick={async () => {
              const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

              if (!tab?.url || tab.url.startsWith('chrome')) {
                toast.error('Cannot access chrome-related pages');

                return;
              }

              await onSend('Find Data');
            }}>
              Data
            </MessageTemplate>
            <MessageTemplate onClick={async () => {
              const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

              if (!tab?.url || tab.url.startsWith('chrome')) {
                toast.error('Cannot access chrome-related pages');

                return;
              }

              await onSend('Get Summary');
            }}>
              Info
            </MessageTemplate>
          </Box>
        )}
        {!settingsMode && !historyMode && (
          <Box
            background="var(--active)"
            borderTop="2px solid var(--text)"
            display="flex"
            justifyContent="space-between"
            pb={2}
            position="relative"  // Add this
            pt={2}
            style={{ opacity: settingsMode ? 0 : 1 }}
            zIndex={2}
          >
            {/* Add paper texture layer */}
            <Box
              bottom={0}
              left={0}
              position="absolute"
              right={0}
              sx={{
                backgroundImage: 'url(assets/images/paper-texture.png)',
                backgroundSize: '512px',
                opacity: 0.3,
                pointerEvents: 'none',
                mixBlendMode: 'multiply',
                zIndex: 0
              }}
              top={0}
            />
            <Input isLoading={isLoading} message={message} setMessage={setMessage} onSend={onSend} />
            <AddToChat />
            <Send isLoading={isLoading} onSend={onSend} />
          </Box>
        )}
        {historyMode && (
          <ChatHistory 
            loadChat={loadChat} 
            onDeleteAll={deleteAll}  // Change this line to use the main deleteAll function
          />
        )}
        {config?.backgroundImage ? <Background /> : null}
      </Box>
      <Toaster
        containerStyle={{
          borderRadius: 16
        }}
        toastOptions={{
          duration: 2000,
          position: "bottom-center",
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: "1.25rem"
          },

          // Default options for specific types
          success: {
            duration: 2000,
            style: {
              background: '#363636',
              color: '#fff',
              fontSize: "1.25rem"
            }
          }
        }} />
    </Container>
  );
};

export default Bruside;

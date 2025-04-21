import { useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
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
import { ChatHistory, ChatMessage, MessageTurn } from './ChatHistory';  // Remove deleteAll from import
import { useConfig } from './ConfigContext';
import { Header } from './Header';
import { Input } from './Input';
import { Messages } from './Messages';
import {
 downloadImage, downloadJson, downloadText 
} from './messageUtils';
import { Send } from './Send';
import { Settings } from './Settings';
import storage from '../util/storageUtil';

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
      storage.setItem('pagestring', res?.text || ''); // Raw string, no JSON.stringify
      storage.setItem('pagehtml', res?.html || '');
      storage.setItem('alttexts', res?.altTexts || '');
      storage.setItem('tabledata', res?.tableData || '');
    } catch (err) {
      console.debug('storage error:', err);
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
  const [turns, setTurns] = useState<MessageTurn[]>([]);
  const [message, setMessage] = useState('');
  const [chatId, setChatId] = useState(generateChatId());
  const [webContent, setWebContent] = useState('');
  const [pageContent, setPageContent] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [settingsMode, setSettingsMode] = useState(false);
  const [historyMode, setHistoryMode] = useState(false);
  const { config, updateConfig } = useConfig();
  const [currentTabInfo, setCurrentTabInfo] = useState({ id: null, url: '' });

  useEffect(() => {
    if (!config?.chatMode === 'page') return;

    // Function to check and inject if needed
    const checkAndInject = async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      
      // Only inject if tab or URL changed
      if (tab?.id && tab.url && (tab.id !== currentTabInfo.id || tab.url !== currentTabInfo.url)) {
        setCurrentTabInfo({ id: tab.id, url: tab.url });
        await injectBridge();
      }
    };

    // Initial check
    checkAndInject();

    // Set up tab change listeners
    const handleTabActivated = (activeInfo) => {
      checkAndInject();
    };

    const handleTabUpdated = (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' || changeInfo.url) {
        checkAndInject();
      }
    };

    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);

    // Cleanup listeners
    return () => {
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
    };
  }, [config?.chatMode]); // Only re-run if chatMode changes

  const { chatTitle, setChatTitle } = useChatTitle(isLoading, turns, message);

  const onSend = useSendMessage(isLoading, message, turns, webContent, config, setTurns, setMessage, setWebContent, setPageContent, setLoading);

  useUpdateModels();

  const reset = () => {
    setTurns([]);
    setPageContent('');
    setWebContent('');
    setLoading(false);
    updateConfig({ chatMode: undefined });
    setMessage('');
    setChatTitle('');
    setChatId(generateChatId());
    setHistoryMode(false); // Add this
  };

  const onReload = () => {
    // Keep only the second-to-last turn (the last user message)
    const lastUserTurn = turns.length >= 2 ? turns[turns.length - 2] : null;
    if (lastUserTurn?.role === 'user') {
        setTurns([lastUserTurn]); // Keep only that user turn
        setMessage(lastUserTurn.rawContent || ''); // Set input field
    } else {
        // If history is too short or last user message not found, just reset turns
        setTurns([]);
        setMessage('');
    }
    setLoading(false); // Ensure loading is reset
  };

  const loadChat = (chat: { id: string, title: string, messages: ChatMessage[] }) => {
    setChatTitle(chat.title || '');
    setTurns(chat.turns);
    setChatId(chat.id);
    setHistoryMode(false);
  };

  useEffect(() => {
    if (turns.length && !isLoading) {
      const savedChat = ChatMessage = {
        id: chatId,
        title: chatTitle,
        turns, // Already contains proper role info
        last_updated: Date.now(),
        model: config?.selectedModel
      };
      console.log(`[${Date.now()}] Bruside: Saving chat ${chatId}`, savedChat); // Debug log

      localforage.setItem(chatId, savedChat);
    }
  }, [chatId, turns, isLoading, chatTitle, config?.selectedModel]);

  const deleteAll = async () => {
    const keys = await localforage.keys();
    await Promise.all(keys.map(key => localforage.removeItem(key)));
    setTurns([]);
    setPageContent('');
    setWebContent('');
    setLoading(false);
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
      storage.deleteItem('pagestring');
      storage.deleteItem('pagehtml');
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
          downloadImage={() => downloadImage(turns)}
          downloadJson={() => downloadJson(turns)}
          downloadText={() => downloadText(turns)}
          historyMode={historyMode}
          reset={reset}
          setHistoryMode={setHistoryMode}
          setSettingsMode={setSettingsMode}
          settingsMode={settingsMode}
        />
        {settingsMode && <Settings />}
        {!settingsMode && !historyMode && turns.length > 0 && (
          <Messages
            isLoading={isLoading}
            turns={turns}
            settingsMode={settingsMode}
            onReload={onReload}
          />
        )}
        {!settingsMode && !historyMode && turns.length === 0 && !config?.chatMode && (
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
        {!settingsMode && !historyMode && turns.length === 0 && config?.chatMode === "page" && (
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
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: "1.25rem"
          },

          // Default options for specific types
          success: {
            duration: 2000,
            style: {
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: "1.25rem"
            }
          }
        }} />
    </Container>
  );
};

export default Bruside;

import { useEffect, useState, useRef } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import {
  Box,
  Container,
  Tooltip,
  IconButton,
  HStack,
} from '@chakra-ui/react';
import localforage from 'localforage';
import { TbWorldSearch, TbBrowserPlus } from "react-icons/tb"; // <-- Import icons
import { BiBrain } from "react-icons/bi";

import { useChatTitle } from './hooks/useChatTitle';
import useSendMessage from './hooks/useSendMessage';
import { useUpdateModels } from './hooks/useUpdateModels';
import { AddToChat } from './AddToChat';
import { Background } from './Background';
import { ChatHistory, ChatMessage, MessageTurn } from './ChatHistory';
import { useConfig } from './ConfigContext';
import { Header } from './Header';
import { Input } from './Input';
import { Messages } from './Messages';
import {
 downloadImage, downloadJson, downloadText
} from './messageUtils';
import { Send } from './Send';
import { Settings } from './Settings';
import storage from '../background/storageUtil';

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
  if (!tab?.id || tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://') || tab.url?.startsWith('about:')) { // Added about:
    console.debug('[Cognito:] Skipping injection for restricted URL:', tab?.url);
    // Clear storage if activating/navigating to a restricted tab
    storage.deleteItem('pagestring');
    storage.deleteItem('pagehtml');
    storage.deleteItem('alttexts');
    storage.deleteItem('tabledata');
    return;
  }

  console.debug(`[Cognito:] Attempting injection into tab ${tab.id} (${tab.url})`);

  // Clear storage before injection attempt
  storage.deleteItem('pagestring');
  storage.deleteItem('pagehtml');
  storage.deleteItem('alttexts');
  storage.deleteItem('tabledata');
  console.debug('[Cognito:] Cleared previous page content from storage.');

  try {
    console.debug('[Cognito:] Executing bridge function...');
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: bridge
    });

    // Basic result checking
    if (!results || !Array.isArray(results) || results.length === 0 || !results[0] || typeof results[0].result !== 'string') {
        console.error('[Cognito:] Bridge function execution returned invalid or unexpected results structure:', results);
        // No toast here in the reverted version, just log
        return;
    }

    const rawResult = results[0].result;
    let res: any; // Use 'any' for simplicity in reverted version or define a simple interface
    try {
        res = JSON.parse(rawResult);
    } catch (parseError) {
        console.error('[Cognito:] Failed to parse JSON result from bridge:', parseError, 'Raw result string:', rawResult);
        return;
    }

    // Check for error field from bridge (added basic error handling)
    if (res.error) {
        console.error('[Cognito:] Bridge function reported an error:', res.error, 'Title:', res.title);
        return;
    }

    console.debug('[Cognito:] Bridge function parsed result:', { // Log subset
        title: res?.title,
        textLength: res?.text?.length,
        htmlLength: res?.html?.length
    });
    console.log(`[Cognito:] Extracted Content: Text=${res?.text?.length}, HTML=${res?.html?.length}`);


    // Store the extracted content (reverted version)
    try {
      storage.setItem('pagestring', res?.text ?? ''); // Use nullish coalescing
      storage.setItem('pagehtml', res?.html ?? '');
      storage.setItem('alttexts', res?.altTexts ?? '');
      storage.setItem('tabledata', res?.tableData ?? '');
      console.debug('[Cognito:] Stored extracted content.');
    } catch (storageError) {
        console.error('[Cognito:] Storage error after successful extraction:', storageError);
        // Attempt to clear storage again on error
        storage.deleteItem('pagestring');
        storage.deleteItem('pagehtml');
        storage.deleteItem('alttexts');
        storage.deleteItem('tabledata');
    }
  } catch (execError) {
    console.error('[Cognito:] Bridge function execution failed:', execError);
    // Log specific errors if needed, but avoid user-facing toasts in reverted version
    if (execError instanceof Error && (execError.message.includes('Cannot access contents of url "chrome://') || execError.message.includes('Cannot access a chrome extension URL') || execError.message.includes('Cannot access contents of url "about:'))) {
        console.warn('[Cognito:] Cannot access restricted URL.');
    }
    // Storage should have been cleared before the try block
  }
}


const generateChatId = () => `chat_${Math.random().toString(16).slice(2)}`;

const MessageTemplate = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => ( // Keep type annotation
  <Box
    background="var(--active)"
    border="1px solid var(--text)"
    borderRadius={16}
    color="var(--text)"
    cursor="pointer"
    display="flex"
    alignItems="center"
    justifyContent="center"
    fontSize="md"
    fontWeight={800}
    p={0.5}
    placeItems="center"
    position="relative"
    textAlign={'center'}
    width="4rem"
    onClick={onClick}
    flexShrink={0}
    _hover={{ // Keep hover effect
        background: "rgba(var(--text-rgb), 0.1)"
    }}
    transition="background 0.2s ease-in-out"
  >
    {children}
  </Box>
);

const Cognito = () => {
  const [turns, setTurns] = useState<MessageTurn[]>([]);
  const [message, setMessage] = useState('');
  const [chatId, setChatId] = useState(generateChatId());
  const [webContent, setWebContent] = useState('');
  const [pageContent, setPageContent] = useState(''); // Keep state, might be used by useSendMessage
  const [isLoading, setLoading] = useState(false);
  const [settingsMode, setSettingsMode] = useState(false);
  const [historyMode, setHistoryMode] = useState(false);
  const { config, updateConfig } = useConfig();
  const [currentTabInfo, setCurrentTabInfo] = useState<{ id: number | null, url: string }>({ id: null, url: '' });

  const containerRef = useRef<HTMLDivElement>(null);
  const lastInjectedRef = useRef<{ id: number | null, url: string }>({ id: null, url: '' }); // Keep ref for tab change logic

  // Resize observer remains the same
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        containerRef.current.style.minHeight = '100dvh';
        requestAnimationFrame(() => {
          if (containerRef.current) {
            containerRef.current.style.minHeight = '';
          }
        });
      }
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Tab management useEffect (Reverted Logic - simpler check)
  useEffect(() => {
    if (config?.chatMode !== 'page') return;

    // Function to check and inject if needed (Reverted - simpler logic)
    const checkAndInject = async () => {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (!tab?.id || !tab.url) return;

      // Skip injection for restricted URLs upfront
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
          console.log(`[Cognito ] Active tab is restricted (${tab.url}). Skipping injection.`);
          // Clear storage if the active tab is restricted and changed
          if (lastInjectedRef.current.id !== tab.id || lastInjectedRef.current.url !== tab.url) {
              storage.deleteItem('pagestring');
              storage.deleteItem('pagehtml');
              storage.deleteItem('alttexts');
              storage.deleteItem('tabledata');
              console.log("[Cognito ] Cleared storage due to restricted tab activation/update.");
          }
          lastInjectedRef.current = { id: tab.id, url: tab.url };
          setCurrentTabInfo({ id: tab.id, url: tab.url }); // Update current tab info
          return; // Don't inject
      }

      // Inject if tab or URL changed (and not restricted)
      // Use lastInjectedRef to track if injection already happened for this tab/url
      if (tab.id !== lastInjectedRef.current.id || tab.url !== lastInjectedRef.current.url) {
        console.log(`[Cognito ] Tab changed or updated. Old: ${lastInjectedRef.current.id}/${lastInjectedRef.current.url}, New: ${tab.id}/${tab.url}. Re-injecting bridge.`);
        lastInjectedRef.current = { id: tab.id, url: tab.url }; // Update ref *before* injection
        setCurrentTabInfo({ id: tab.id, url: tab.url }); // Update current tab info
        await injectBridge(); // Inject using the reverted function
      } else {
        console.log(`[Cognito ] Tab activated/updated, but ID and URL match last injection. Skipping bridge injection.`);
      }
    };

    // Initial check when mode switches to 'page'
    checkAndInject();

    // Set up tab change listeners (Reverted - simpler logic)
    const handleTabActivated = (activeInfo: chrome.tabs.TabActiveInfo) => {
      console.log(`[Cognito ] Tab activated: tabId ${activeInfo.tabId}`);
      // Get tab info to check URL and call checkAndInject
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (chrome.runtime.lastError) {
          console.warn(`[Cognito ] Error getting tab info on activation: ${chrome.runtime.lastError.message}`);
          return;
        }
        // checkAndInject handles restricted URLs and injection decision
        checkAndInject();
      });
    };

    const handleTabUpdated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
      // Inject only when the active tab finishes loading or its URL changes
      if (tab.active && (changeInfo.status === 'complete' || (changeInfo.url && tab.status === 'complete'))) {
         console.log(`[Cognito ] Active tab updated: tabId ${tabId}, status: ${changeInfo.status}, url changed: ${!!changeInfo.url}`);
         // checkAndInject handles restricted URLs and injection decision
         checkAndInject();
      }
    };

    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onUpdated.addListener(handleTabUpdated);

    // Cleanup listeners
    return () => {
      console.log("[Cognito ] Cleaning up tab listeners for 'page' mode.");
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      // Clear last injected ref when mode changes away from 'page' or component unmounts
      lastInjectedRef.current = { id: null, url: '' };
    };
  }, [config?.chatMode]); // Re-run setup/cleanup when chatMode changes

  const { chatTitle, setChatTitle } = useChatTitle(isLoading, turns, message);

  const onSend = useSendMessage(isLoading, message, turns, webContent, config, setTurns, setMessage, setWebContent, setPageContent, setLoading);

  useUpdateModels();

  const reset = () => {
    console.log("[Cognito ] Resetting chat state.");
    setTurns([]);
    setPageContent(''); // Reset this state too
    setWebContent('');
    setLoading(false);
    updateConfig({ chatMode: undefined, computeLevel: 'low' }); // Reset computeLevel here
    setMessage('');
    setChatTitle('');
    setChatId(generateChatId());
    setHistoryMode(false);
    setSettingsMode(false); // Ensure settings mode is also reset
  };

  const onReload = () => {
    setTurns(prevTurns => {
      if (prevTurns.length < 2) return prevTurns;
      const last = prevTurns[prevTurns.length - 1];
      const secondLast = prevTurns[prevTurns.length - 2];
      if (last.role === 'assistant' && secondLast.role === 'user') {
        console.log("[Cognito ] Reloading last user message.");
        setMessage(secondLast.rawContent);
        return prevTurns.slice(0, -2);
      }
      console.log("[Cognito ] Cannot reload, conditions not met.");
      return prevTurns;
    });
    setLoading(false);
  };

  const loadChat = (chat: ChatMessage) => {
    console.log(`[Cognito ] Loading chat ${chat.id}`);
    setChatTitle(chat.title || '');
    setTurns(chat.turns);
    setChatId(chat.id);
    setHistoryMode(false); // Exit history mode after loading
    setSettingsMode(false); // Ensure settings mode is off
    updateConfig({ chatMode: undefined }); // Reset chat mode when loading history
    // Clear any potentially stale page content from storage
    storage.deleteItem('pagestring');
    storage.deleteItem('pagehtml');
    storage.deleteItem('alttexts');
    storage.deleteItem('tabledata');
    lastInjectedRef.current = { id: null, url: '' }; // Reset injection ref
  };

  // Chat saving useEffect (Reverted - simpler log)
  useEffect(() => {
    if (turns.length > 0 && !isLoading && !historyMode && !settingsMode) { // Added history/settings check
      const savedChat: ChatMessage = {
        id: chatId,
        title: chatTitle || `Chat ${new Date(Date.now()).toLocaleString()}`, // Ensure title exists
        turns,
        last_updated: Date.now(),
        model: config?.selectedModel
      };
      console.log(`[Cognito ] Saving chat ${chatId} (Turns: ${turns.length})`); // Simpler log
      localforage.setItem(chatId, savedChat).catch(err => {
        console.error(`[Cognito ] Error saving chat ${chatId}:`, err);
      });
    }
  }, [chatId, turns, isLoading, chatTitle, config?.selectedModel, historyMode, settingsMode]); // Keep dependencies

  const deleteAll = async () => {
    console.log("[Cognito ] Deleting all chat history from localforage.");
    try {
        const keys = await localforage.keys();
        const chatKeys = keys.filter(key => key.startsWith('chat_'));
        await Promise.all(chatKeys.map(key => localforage.removeItem(key)));
        toast.success("Deleted all chats"); // Keep user feedback
        reset(); // Reset the current chat state after deleting all
    } catch (error) {
        console.error("[Cognito] Error deleting all chats:", error);
        toast.error("Failed to delete chats"); // Keep user feedback
    }
  };

  // Panel open/close useEffect (Revised - Don't set lastInjectedRef on open)
  useEffect(() => {
    let cancelled = false;

    const handlePanelOpen = async () => {
      console.log("[Cognito - Revised] Panel opened. Resetting state.");
      reset(); // Reset state first

      // Check current tab immediately on open ONLY to clear storage if needed
      try {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if (!cancelled && tab?.id && tab.url) {
            // Only update currentTabInfo state here, NOT lastInjectedRef
            setCurrentTabInfo({ id: tab.id, url: tab.url }); // Keep this for UI/display if needed

            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
                console.log("[Cognito - Revised] Panel opened on restricted tab. Clearing storage.");
                storage.deleteItem('pagestring');
                storage.deleteItem('pagehtml');
                storage.deleteItem('alttexts');
                storage.deleteItem('tabledata');
                // Explicitly reset lastInjectedRef here too for clarity, although close should handle it
                lastInjectedRef.current = { id: null, url: '' };
            } else {
                console.log("[Cognito - Revised] Panel opened on valid tab. Injection will occur if mode switched to 'page'. lastInjectedRef is currently:", lastInjectedRef.current);
                // DO NOT set lastInjectedRef here. Let checkAndInject handle it.
            }
        } else if (!cancelled) {
            console.log("[Cognito - Revised] Panel opened, but no active tab found or tab has no URL.");
            // Reset refs and state if no valid tab found
            lastInjectedRef.current = { id: null, url: '' };
            setCurrentTabInfo({ id: null, url: '' });
            storage.deleteItem('pagestring'); // Clear storage too
            storage.deleteItem('pagehtml');
            storage.deleteItem('alttexts');
            storage.deleteItem('tabledata');
        }
      } catch (error) {
        if (!cancelled) { 
        console.error("[Cognito - Revised] Error during panel open tab check:", error);
          // Reset refs and state on error
          lastInjectedRef.current = { id: null, url: '' };
          setCurrentTabInfo({ id: null, url: '' });
          storage.deleteItem('pagestring');
          storage.deleteItem('pagehtml');
          storage.deleteItem('alttexts');
          storage.deleteItem('tabledata');
      }
    }
  }

    handlePanelOpen(); // Run on component mount (panel open)

    // Return cleanup function for component unmount (panel close) - Keep this as is
    return () => {
      cancelled = true; // Set cancelled to true to prevent state updates
      console.log("[Cognito - Revised] Panel closing (component unmount). Clearing cached content and resetting state.");
      // Clear cached content from storage
      storage.deleteItem('pagestring');
      storage.deleteItem('pagehtml');
      storage.deleteItem('alttexts');
      storage.deleteItem('tabledata');
      // Reset component state fully on close
      reset();
      lastInjectedRef.current = { id: null, url: '' }; // Clear injection ref
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  // Function to handle editing a specific turn
  const handleEditTurn = (index: number, newContent: string) => {
    setTurns(prevTurns => {
      const updatedTurns = [...prevTurns];
      // Update the turn regardless of the role for visual editing
      if (updatedTurns[index]) {
        updatedTurns[index] = { ...updatedTurns[index], rawContent: newContent };
      }
      return updatedTurns;
    });
    // The useEffect for saving chat will automatically pick up the change in 'turns'
  };

  const [isHovering, setIsHovering] = useState(false);

  return (
    <Container
      ref={containerRef}
      maxWidth="100%"
      minHeight="100dvh" // Use dynamic viewport height
      padding={0}
      position="relative" // Ensure proper stacking context
      overflow="hidden" // Prevent layout shifts
      display="flex"
      flexDirection="column"
      bg="var(--bg)" // Ensure background color is set
    >
      <Box
        display="flex"
        flexDir="column"
        justifyContent="space-between"
        minHeight="100dvh" // Changed from 100vh to 100dvh
        flexGrow={1} // Allow this box to grow
      >
        <Header
          chatTitle={chatTitle}
          deleteAll={deleteAll}
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
        <Box display="flex" flexDir="column" flex="1 1 0%" minHeight={0}>
          {!settingsMode && !historyMode && turns.length > 0 && (
                <Messages
                  isLoading={isLoading}
                  turns={turns}
                  settingsMode={settingsMode}
                  onReload={onReload}
                  onEditTurn={handleEditTurn} // Pass the edit handler down
                />
              )}
          {!settingsMode && !historyMode && turns.length === 0 && !config?.chatMode && (
            // Adjust positioning and layout if needed for icons
            <Box bottom="4rem" left="2rem" position="absolute" display="flex" flexDirection="column" gap={2}>
                    <Tooltip
                    label={`Compute Level: ${config.computeLevel?.toUpperCase()}. Click to change. [Warning]: beta feature and resource costly.`}
                    placement="right"
                    hasArrow
                    bg="var(--bg)"      // Added style
                    color="var(--text)" // Added style
                  >
                {/* Use IconButton */}
                    <IconButton
                      aria-label="Cycle compute level"
                      icon={<BiBrain size="24px" />} // Increased size
                      color={
                        config.computeLevel === 'high' ? 'red.500' :
                        config.computeLevel === 'medium' ? 'orange.500' :
                        'var(--text)' // Default color for low
                      }
                      onClick={() => {
                        const currentLevel = config.computeLevel;
                        const nextLevel = currentLevel === 'low' ? 'medium' : currentLevel === 'medium' ? 'high' : 'low';
                        updateConfig({ computeLevel: nextLevel });
                      }}
                      variant="ghost"
                      size="lg" // Match other icon button sizes
                      _hover={{ bg: 'rgba(128, 128, 128, 0.2)' }}
                  />
                  </Tooltip>
                  <Tooltip
                    label="Add Web Search Results to LLM Context"
                    placement="right"
                    hasArrow
                    bg="var(--bg)"      // Added style
                    color="var(--text)" // Added style
                  >
                {/* Use IconButton */}
                    <IconButton
                  aria-label="Add Web Search Results to LLM Context" // Important for accessibility
                  icon={<TbWorldSearch size="24px" />} // Pass icon component to 'icon' prop
                  onClick={() => {
                    updateConfig({ chatMode: 'web' });
                  }}
                  variant="ghost" // Use 'ghost' for minimal styling, or 'unstyled'
                  size="lg"      // Adjust size: 'sm', 'md', 'lg'
                  color="var(--text)" // Ensure icon color matches
                  // isRound // Optional: makes the button circular
                  _hover={{ bg: 'rgba(128, 128, 128, 0.2)' }} // Optional: subtle hover effect
                    />
                  </Tooltip>
                  <Tooltip
                    label="Add Current Web Page to LLM Context"
                    placement="right"
                    hasArrow
                    bg="var(--bg)"      // Added style
                    color="var(--text)" // Added style
                  >
                {/* Use IconButton */}
                    <IconButton
                      aria-label="Add Current Web Page to LLM Context"
                      icon={<TbBrowserPlus size="24px" />}
                  onClick={() => {
                    updateConfig({ chatMode: 'page' });
                  }}
                      variant="ghost"
                      size="lg"
                      color="var(--text)"
                  // isRound
                      _hover={{ bg: 'rgba(128, 128, 128, 0.2)' }}
                    />
                  </Tooltip>
                </Box>
              )}
          {!settingsMode && !historyMode && config?.chatMode === "page" && (
                 <Box
              bottom="3.5rem"
              left="0rem"
              right="0rem"
              position="fixed" 
                    display="flex"
              flexDirection="row"
              justifyContent="center"
              maxWidth="100%"
              height="3rem"
              zIndex={2}
              opacity={isHovering ? 1 : 0} // Fade in/out
              transform={isHovering ? "translateY(0)" : "translateY(-10px)"} // Slide up/down
              transition="all 0.2s ease-in-out" // Smooth animation
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                       sx={{
                 background: 'transparent',
                 padding: '0rem',
                 backdropFilter: 'blur(10px)',
               }}
            >
             <HStack spacing={6} maxW="100%" overflowX="auto" px={4}> {/* Added padding */}
              <MessageTemplate onClick={() => onSend('Provide your summary.')}>
                TLDR
              </MessageTemplate>
              <MessageTemplate onClick={() => onSend('Extract all key figures, names, locations, and dates mentioned on this page and list them.')}>
                Facts
              </MessageTemplate>
              <MessageTemplate onClick={() => onSend('Find positive developments, achievements, or opportunities mentioned on this page.')}>
                Yay!
              </MessageTemplate>
              <MessageTemplate onClick={() => onSend('Find concerning issues, risks, or criticisms mentioned on this page.')}>
                Oops
              </MessageTemplate>
                    </HStack>
                  </Box>
          )}
        </Box>
        {!settingsMode && !historyMode && (
          <Box
            background="var(--active)"
            borderTop="1px solid var(--text)"
            display="flex"
            justifyContent="space-between"
            pb={1}
            position="relative"  // Add this
            pt={1}
            style={{ opacity: settingsMode ? 0 : 1 }}
            zIndex={2}
          >
            <Input isLoading={isLoading} message={message} setMessage={setMessage} onSend={onSend} />
            <AddToChat />
            <Send isLoading={isLoading} onSend={() => onSend(message)} />
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
          borderRadius: 16,
          bottom: '60px', // Adjust position if needed
        }}
        toastOptions={{
          duration: 2000,
          position: "bottom-center",
          style: {
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: "1rem", // Reverted font size
            border: '1px solid var(--text)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
          success: {
            duration: 2000,
            style: {
              background: 'var(--bg)',
              color: 'var(--text)',
              fontSize: "1.25rem"
            }
          }
        }}
      />
    </Container>
  );
};


export default Cognito;

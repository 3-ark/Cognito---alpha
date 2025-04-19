import { Dispatch, SetStateAction, useRef } from 'react';

import { fetchDataAsStream, webSearch, processQueryWithAI } from '../network';

// --- Interfaces (Model, Config, ApiMessage) remain the same ---
interface Model {
  id: string;
  host?: 'groq' | 'ollama' | 'gemini' | 'lmStudio' | 'openai' | string;
  active?: boolean;
}
interface Config {
  chatMode?: 'web' | 'page' | string;
  webMode?: 'brave' | 'google' | 'duckduckgo' | string;
  generateTitle?: boolean;
  personas: Record<string, string>;
  persona: string;
  models?: Model[];
  selectedModel?: string;
  contextLimit?: number;
  webLimit?: number;
  ollamaUrl?: string;
  lmStudioUrl?: string;
  groqApiKey?: string;
  geminiApiKey?: string;
  openAiApiKey?: string;
  pageMode?: string;
}
interface ApiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}


// getAuthHeader remains the same...
export const getAuthHeader = (config: Config, currentModel: Model) => {
  if (currentModel?.host === 'groq' && config.groqApiKey) {
    return { Authorization: `Bearer ${config.groqApiKey}` };
  }
  if (currentModel?.host === 'gemini' && config.geminiApiKey) {
    return { Authorization: `Bearer ${config.geminiApiKey}` };
  }
  if (currentModel?.host === 'openai' && config.openAiApiKey) {
    return { Authorization: `Bearer ${config.openAiApiKey}` };
  }
  return undefined;
};


const useSendMessage = (
  isLoading: boolean,
  originalMessage: string,
  messages: string[],
  webContent: string,
  config: Config | null | undefined,
  setMessages: Dispatch<SetStateAction<string[]>>,
  setMessage: Dispatch<SetStateAction<string>>,
  setResponse: Dispatch<SetStateAction<string>>,
  setWebContent: Dispatch<SetStateAction<string>>,
  setPageContent: Dispatch<SetStateAction<string>>,
  setLoading: Dispatch<SetStateAction<boolean>>
) => {
   // Use a ref to track if the completion logic for a specific call has run
   const completionGuard = useRef<Record<number, boolean>>({});
  
   const onSend = async (overridedMessage?: string) => {
    // Generate a unique ID for this specific call to onSend
    const callId = Date.now();
    console.log(`[${callId}] useSendMessage: onSend triggered.`);
    
    const message = overridedMessage || originalMessage;

    if (isLoading) {
      console.log(`[${callId}] useSendMessage: Bailing out: isLoading is true.`);
      return;
    }
    if (!message || !config) {
      console.log(`[${callId}] useSendMessage: Bailing out: Missing message or config.`);
      return;
    }

    console.log(`[${callId}] useSendMessage: Setting loading true.`);

    setLoading(true);
    setWebContent(''); // Clear previous web content display
    setPageContent('');
    setResponse('');
    // Reset the guard for this new call
    completionGuard.current[callId] = false;

    let finalQuery = message;
    let searchRes: string = '';
    let processedQueryDisplay = ''; // To store the query for display

    const performSearch = config?.chatMode === 'web';
    const currentModel = config?.models?.find(m => m.id === config.selectedModel);

    if (!currentModel) {
      console.error("[${callId}] useSendMessage: No current model found.");
      setLoading(false);
      return;
    }
    const authHeader = getAuthHeader(config, currentModel);

    // --- Step 1: Optimize Query ---
    if (performSearch) {
      console.log("useSendMessage: Optimizing query for web search...");
      const optimizedQuery = await processQueryWithAI(
        message,
        config,
        currentModel,
        authHeader,
        messages
      );
      // Only update finalQuery if optimization was successful and different
      if (optimizedQuery && optimizedQuery !== message) {
          finalQuery = optimizedQuery;
          processedQueryDisplay = `**SUB:** [*${finalQuery}*]\n\n`; // Prepare for display
          console.log(`[${callId}] useSendMessage: Query optimized to: "${finalQuery}"`);
      } else {
          processedQueryDisplay = `**ORG:** (${finalQuery})\n\n`;
          console.log(`[${callId}] useSendMessage: Using original query: "${finalQuery}"`);
      }
    }

    // --- Step 2: Perform Web Search ---
    if (performSearch) {
      console.log(`[${callId}] useSendMessage: Performing web search...`);
      searchRes = await webSearch(finalQuery, config.webMode || 'google').catch(/* ... */);
      console.log(`[${callId}] useSendMessage: Web search done. Length: ${searchRes.length}`);
   }

    // *** This variable holds the string you want to prepend ***
    const webLimit = 1000 * (config?.webLimit || 1);
    const limitedWebResult = webLimit && typeof searchRes === 'string'
      ? searchRes.substring(0, webLimit)
      : searchRes;

    const combinedWebContentDisplay = processedQueryDisplay; 

    const webContentForLlm = config?.webLimit === 128 ? searchRes : limitedWebResult;
    setWebContent(combinedWebContentDisplay);
    console.log(`[${callId}] useSendMessage: Web content prepared for display.`);

    // --- Step 3: Prepare Context & Messages ---
    const currentMessages: ApiMessage[] = [message, ...messages]
      .map((m: string, i: number): ApiMessage => ({
        content: m || '',
        role: i % 2 === 1 ? 'assistant' : 'user'
      }))
      .reverse();

    const newMessages = ['', message, ...messages];
    setMessages(newMessages);
    setMessage('');
    console.log(`[${callId}] useSendMessage: User message added to state.`);

    const persona = config?.personas?.[config?.persona] || '';

    const safeJsonParse = (key: string, defaultValue: string = '""') => {
      try {
        const item = localStorage.getItem(key);
        return JSON.parse(item || defaultValue);
      } catch (e) {
        console.error(`Failed to parse ${key} from localStorage`, e);
        try { return JSON.parse(defaultValue); } catch { return ''; }
      }
    };

    const pageString = safeJsonParse('pagestring');
    const pageHtml = safeJsonParse('pagehtml');
    const pageStringContent = typeof pageString === 'string' ? pageString : '';
    const pageHtmlContent = typeof pageHtml === 'string' ? pageHtml : '';

    let pageContentForLlm = '';
    if (config?.chatMode === 'page') {
      let currentPageContent = '';console.log(`[${callId}] useSendMessage: Preparing page content...`);
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab?.url && !tab.url.startsWith('chrome://')) {
        currentPageContent = config?.pageMode === 'html' ? pageHtmlContent : pageStringContent;
      } else {
        console.log("useSendMessage: Not fetching page content.");
      }

      const charLimit = 1000 * (config?.contextLimit || 1);
      const limitedContent = charLimit && typeof currentPageContent === 'string'
        ? currentPageContent.substring(0, charLimit)
        : currentPageContent;
      pageContentForLlm = config?.contextLimit === 128 ? currentPageContent : limitedContent;
      setPageContent(pageContentForLlm || '');
      console.log(`[${callId}] useSendMessage: Page content prepared.`);
    } else {
      setPageContent('');
    }

    // Construct the system prompt (using webContentForLlm which doesn't have the display prefix)
    const systemContent = `
      ${persona}
      ${pageContentForLlm ? `. Use the following page content for context: ${pageContentForLlm}` : ''}
      ${webContentForLlm ? `. Refer to this web search summary: ${webContentForLlm}` : ''}
    `.trim().replace(/\s+/g, ' ');
    console.log(`[${callId}] useSendMessage: System prompt constructed.`);

    // --- Step 4: Call LLM (Streaming) ---
    const configBody = { stream: true };

    if (!currentModel?.host) {
      console.error("useSendMessage: Cannot proceed without currentModel.host");
      setLoading(false);
      return;
    }

    const urlMap: Record<string, string> = {
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      ollama: `${config?.ollamaUrl || ''}/api/chat`,
      gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      lmStudio: `${config?.lmStudioUrl || ''}/v1/chat/completions`,
      openai: 'https://api.openai.com/v1/chat/completions'
    };
    const url = urlMap[currentModel.host];

    if (!url || !currentModel?.host) {
      console.error("[${callId}] Could not determine API URL for host:", currentModel.host);
      setLoading(false);
      return;
    }

    console.log(`[${callId}] useSendMessage: Sending chat request to ${url}`);

    let accumulatedResponse = ''; // Accumulate response here for final setMessages
    fetchDataAsStream(
      url,
      {
        ...configBody,
        model: config?.selectedModel || '',
        messages: [
          { role: 'system', content: systemContent },
          ...currentMessages
        ]
      },
      (part: string, isFinished?: boolean) => {
        console.log(`[${callId}] fetchDataAsStream Callback: isFinished=${isFinished}, part length=${part?.length ?? 0}`);
        
        accumulatedResponse = part || ''; // Update accumulated response
        setResponse(accumulatedResponse); // Update live response state
        
        if (isFinished) {
          console.log("[${callId}] fetchDataAsStream Callback: 'isFinished' block ENTERED.");
          
          if (completionGuard.current[callId]) {
            console.warn(`[${callId}] fetchDataAsStream Callback: 'isFinished' block SKIPPED - already executed for this callId.`);
            return; // Already processed the finish signal for this specific onSend invocation
         }
         completionGuard.current[callId] = true; // Mark as executed for this callId
         console.log(`[${callId}] fetchDataAsStream Callback: Completion guard SET for this callId.`);
         console.log(`[${callId}] Checking value inside 'isFinished': combinedWebContentDisplay length = ${combinedWebContentDisplay?.length}`); //debug
         
         const finalMessageContent = combinedWebContentDisplay
            ? // If yes, prepend it to the AI response with separation
            `**From the Internet**\n${combinedWebContentDisplay}\n\n---\n\n${accumulatedResponse}`        
            : // Otherwise, just use the AI response
            accumulatedResponse;
            console.log(`[${callId}] FINAL finalMessageContent being set (length ${finalMessageContent.length}):\n---\n${finalMessageContent}\n---`);
            console.log(`[${callId}] Preparing to call setMessages with final content.`);
            setMessages(prev => {
              // Log previous state (use length for brevity in prod logs)
              console.log(`[${callId}] setMessages updater: Prev state[0] length: ${prev[0]?.length}`);
              const newState = [finalMessageContent, ...prev.slice(1)];
              // ADD THIS LOG:
              console.log(`[${callId}] setMessages updater: New state[0] length: ${newState[0]?.length}`);
              return newState;
          });
          console.log(`[${callId}] Preparing to call setLoading(false).`);
          setLoading(false);
          console.log(`[${callId}] --- Stream finished processing COMPLETE ---`);          // Optional: Clear the streaming response state if needed, though it gets overwritten on next send
        }
      },
      authHeader,
      currentModel.host
    );
    console.log(`[${callId}] useSendMessage: fetchDataAsStream call INITIATED.`);

  };

  return onSend;
};

export default useSendMessage;

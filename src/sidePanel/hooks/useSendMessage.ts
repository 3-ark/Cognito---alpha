import { Dispatch, SetStateAction } from 'react';

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
  const onSend = async (overridedMessage?: string) => {
    const message = overridedMessage || originalMessage;

    if (isLoading || !message || !config) return;

    setLoading(true);
    setWebContent(''); // Clear previous web content display
    setPageContent('');
    setResponse('');

    let finalQuery = message;
    let searchRes: string = '';
    let processedQueryDisplay = ''; // To store the query for display

    const performSearch = config?.chatMode === 'web';
    const currentModel = config?.models?.find(m => m.id === config.selectedModel);

    if (!currentModel) {
      console.error("useSendMessage: No current model found.");
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
          console.log(`useSendMessage: Original query: "${message}", Processed query: "${finalQuery}"`);
      } else {
          console.log(`useSendMessage: Using original query: "${message}" (Optimization failed or returned same query)`);
          processedQueryDisplay = `**ORG:** (${finalQuery})\n\n`;
      }
    }

    // --- Step 2: Perform Web Search ---
    if (performSearch) {
      if (!config.webMode) {
        console.error("useSendMessage: webMode is not defined.");
        searchRes = '';
      } else {
        console.log(`useSendMessage: Performing web search with query: "${finalQuery}" using mode: ${config.webMode}`);
        searchRes = await webSearch(finalQuery, config.webMode).catch((err) => {
          console.error("useSendMessage: webSearch function failed:", err);
          return '';
        });
        console.log(`useSendMessage: Web search result length: ${searchRes.length}`);
      }
    }

    // *** This variable holds the string you want to prepend ***
    const webLimit = 1000 * (config?.webLimit || 1);
    const limitedWebResult = webLimit && typeof searchRes === 'string'
      ? searchRes.substring(0, webLimit)
      : searchRes;

    // Change this line to ONLY include the processed query for display
    const combinedWebContentDisplay = processedQueryDisplay; // Removed webContentForLlm

    // Keep webContentForLlm ONLY for the system prompt
    const webContentForLlm = config?.webLimit === 128 ? searchRes : limitedWebResult;

    // Keep this if you still want webContent displayed elsewhere too
    setWebContent(combinedWebContentDisplay);

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
      let currentPageContent = '';
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
    } else {
      setPageContent('');
    }

    // Construct the system prompt (using webContentForLlm which doesn't have the display prefix)
    const systemContent = `
      ${persona}
      ${pageContentForLlm ? `. Use the following page content for context: ${pageContentForLlm}` : ''}
      ${webContentForLlm ? `. Refer to this web search summary: ${webContentForLlm}` : ''}
    `.trim().replace(/\s+/g, ' ');

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

    if (!url) {
      console.error("Could not determine API URL for host:", currentModel.host);
      setLoading(false);
      return;
    }

    console.log(`useSendMessage: Sending chat request to ${url}`);

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
        const currentFullresponse = part || '';

        setResponse(currentFullresponse); 

        if (isFinished) {
          console.log("useSendMessage: Stream finished.");
          // --- MODIFICATION START ---
          // Check if there's web content/query info to display
          const finalMessageContent = combinedWebContentDisplay
            ? // If yes, prepend it to the AI response with separation
            `**From the Internet**\n${combinedWebContentDisplay}\n\n---\n\n${currentFullresponse}`        
            : // Otherwise, just use the AI response
            currentFullresponse;
            // --- MODIFICATION END ---          
          
          // Use the final complete response string for the message history
          setMessages(prev => [finalMessageContent, ...prev.slice(1)]);
          setLoading(false);
          // Optional: Clear the streaming response state if needed, though it gets overwritten on next send
          // setResponse('');
        }
      },
      authHeader,
      currentModel.host
    );
  };

  return onSend;
};

export default useSendMessage;

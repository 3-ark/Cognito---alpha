import { Dispatch, SetStateAction, useRef } from 'react';
import { MessageTurn } from '../ChatHistory'; // Adjust path if needed
import { fetchDataAsStream, webSearch, processQueryWithAI } from '../network';
import storage from 'src/util/storageUtil';// --- Interfaces (Model, Config, ApiMessage) remain the same ---
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
  currentTurns: MessageTurn[],
  webContent: string,
  config: Config | null | undefined,
  setTurns: Dispatch<SetStateAction<MessageTurn[]>>,
  setMessage: Dispatch<SetStateAction<string>>,
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
    // Reset the guard for this new call
    completionGuard.current[callId] = false;

    const userTurn: MessageTurn = {
      role: 'user',
      rawContent: message,
      timestamp: Date.now()
    };
    setTurns(prevTurns => [...prevTurns, userTurn]);
    setMessage(''); // Clear input field
    console.log(`[${callId}] useSendMessage: User turn added to state.`);

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
      console.log("[${callId}] useSendMessage: Optimizing query...");
      
      const historyForQueryOptimization: ApiMessage[] = currentTurns.map(turn => ({
        role: turn.role,
        content: turn.rawContent // Use only the raw content
    }));

      const optimizedQuery = await processQueryWithAI(
        message,
        config,
        currentModel,
        authHeader,
        historyForQueryOptimization
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
    console.log(`[${callId}] useSendMessage: Web content prepared for display.`);

    // --- Step 3: Prepare Context & Turns ---
    const messageForApi: ApiMessage[] = currentTurns
      .map((turn): ApiMessage => ({
        content: turn.rawContent || '',
        role: turn.role
      }))
      .concat({ role: 'user', content: message });    


    let pageContentForLlm = '';
    if (config?.chatMode === 'page') {
      let currentPageContent = '';console.log(`[${callId}] useSendMessage: Preparing page content...`);
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      
      if (tab?.url && !tab.url.startsWith('chrome://')) {
        
        const storedPageString = await storage.getItem('pagestring');
        const storedPageHtml = await storage.getItem('pagehtml');
        const pageStringContent = storedPageString || '';
        const pageHtmlContent = storedPageHtml || '';

        currentPageContent = config?.pageMode === 'html' ? pageHtmlContent : pageStringContent;
        console.log(`useSendMessage: Retrieved page content. Mode: ${config?.pageMode}. String length: ${pageStringContent.length}, HTML length: ${pageHtmlContent.length}`);
      } else {
        console.log("useSendMessage: Not fetching page content.");
      }

      const charLimit = 1000 * (config?.contextLimit || 1);
      const safeCurrentPageContent = typeof currentPageContent === 'string' ? currentPageContent : '';
      const limitedContent = charLimit && safeCurrentPageContent
        ? safeCurrentPageContent.substring(0, charLimit)
        : safeCurrentPageContent;

      pageContentForLlm = config?.contextLimit === 128 ? currentPageContent : limitedContent;
      setPageContent(pageContentForLlm || '');
      console.log(`[${callId}] useSendMessage: Page content prepared. Length: ${pageContentForLlm?.length}`);
    } else {
      setPageContent('');
    }

    // Construct the system prompt (using webContentForLlm which doesn't have the display prefix)
    const persona = config?.personas?.[config?.persona] || '';
    const systemContent = `
      ${persona}
      ${pageContentForLlm ? `. Use the following page content for context: ${pageContentForLlm}` : ''}
      ${webContentForLlm ? `. Refer to this web search summary: ${webContentForLlm}` : ''}
    `.trim().replace(/\s+/g, ' ');
    console.log(`[${callId}] useSendMessage: System prompt constructed.`);

    // --- Add Placeholder Assistant Turn ---
    const assistantTurnPlaceholder: MessageTurn = {
      role: 'assistant',
      rawContent: '', // Start empty
      webDisplayContent: combinedWebContentDisplay, // Store the prefix info here!
      timestamp: Date.now() + 1 // Ensure slightly later timestamp
    };
    setTurns(prevTurns => [...prevTurns, assistantTurnPlaceholder]);
    console.log(`[${callId}] useSendMessage: Assistant placeholder turn added.`);

    // --- Step 4: Call LLM (Streaming) ---
    const configBody = { stream: true };
    const urlMap: Record<string, string> = {
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      ollama: `${config?.ollamaUrl || ''}/api/chat`,
      gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      lmStudio: `${config?.lmStudioUrl || ''}/v1/chat/completions`,
      openai: 'https://api.openai.com/v1/chat/completions'
    };
    const host = currentModel.host || '';
    const url = urlMap[host];

    if (!url) {
      console.error("[${callId}] Could not determine API URL for host:", currentModel.host);
      setLoading(false);
      return;
    }

    console.log(`[${callId}] useSendMessage: Sending chat request to ${url}`);

    fetchDataAsStream(
      url,
      {
        ...configBody,
        model: config?.selectedModel || '',
        messages: [
          { role: 'system', content: systemContent },
          ...messageForApi
        ]
      },
      (part: string, isFinished?: boolean, isError?: boolean) => {
        console.log(`[${callId}] fetchDataAsStream Callback: isFinished=${isFinished}, part length=${part?.length ?? 0}`);
        
        setTurns(prevTurns => {
          if (prevTurns.length === 0) return prevTurns; // Should not happen if placeholder added
          const lastTurn = prevTurns[prevTurns.length - 1];
          // Only update if it's the assistant placeholder we added
          if (lastTurn.role === 'assistant') {
              // Update content, potentially mark as error
              const updatedContent = isError ? `Error: ${part}` : part;
               // Create a new object for the last turn to ensure state update
              const updatedLastTurn = { ...lastTurn, rawContent: updatedContent };
              return [...prevTurns.slice(0, -1), updatedLastTurn]; // Replace last element
          }
          return prevTurns; // Return previous state if last turn wasn't assistant
      });
        
      if (isFinished) {
          console.log("[${callId}] fetchDataAsStream Callback: 'isFinished' block ENTERED.");
          
          if (completionGuard.current[callId]) {
            console.warn(`[${callId}] fetchDataAsStream Callback: 'isFinished' block SKIPPED - already executed for this callId.`);
            return; // Already processed the finish signal for this specific onSend invocation
          }
          completionGuard.current[callId] = true; // Mark as executed for this callId
          console.log(`[${callId}] fetchDataAsStream Callback: Completion guard SET for this callId.`);
         
          // Final check log (optional)
          setTurns(prev => {
          console.log(`[${callId}] FINAL state check: Last turn content length = ${prev[prev.length-1]?.rawContent?.length}, webDisplay length = ${prev[prev.length-1]?.webDisplayContent?.length}`);
          return prev; // Just logging, no actual change here
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

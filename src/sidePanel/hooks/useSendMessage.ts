import { Dispatch, SetStateAction, useRef } from 'react';
import { MessageTurn } from '../ChatHistory'; // Adjust path if needed
import { fetchDataAsStream, webSearch, processQueryWithAI } from '../network';
import storage from 'src/background/storageUtil';// --- Interfaces (Model, Config, ApiMessage) remain the same ---
import type { Config, Model } from 'src/types/config';
import { normalizeApiEndpoint } from 'src/background/util';
import { handleHighCompute, handleMediumCompute } from './computeHandlers'; // Import handlers

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
  if (currentModel?.host === 'openrouter' && config.openRouterApiKey) {
    return { Authorization: `Bearer ${config.openRouterApiKey}` };
  }
  if (currentModel?.host === 'custom' && config.customApiKey) {
    return { Authorization: `Bearer ${config.customApiKey}` };
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
   const completionGuard = useRef<number | null>(null); // Store the callId being processed
  
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

        // Prevent concurrent sends
    if (completionGuard.current !== null) {
        console.warn(`[${callId}] useSendMessage: Bailing out: Another send operation (ID: ${completionGuard.current}) is already in progress.`);
        return;
    }

    console.log(`[${callId}] useSendMessage: Setting loading true.`);

    setLoading(true);
    setWebContent(''); // Clear previous web content display
    setPageContent('');
    // Reset the guard for this new call
    completionGuard.current = callId; // Mark this callId as active

    const userTurn: MessageTurn = {
      role: 'user',
      status: 'complete',
      rawContent: message,
      timestamp: Date.now()
    };
    setTurns(prevTurns => [...prevTurns, userTurn]);
    setMessage(''); // Clear input field
    console.log(`[${callId}] useSendMessage: User turn added to state.`);

    let queryForProcessing = message; // Use a different variable for the potentially optimized query
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
      if (optimizedQuery && optimizedQuery.trim() && optimizedQuery !== message) {
        queryForProcessing = optimizedQuery;
        processedQueryDisplay = `**SUB:** [*${queryForProcessing}*]\n\n`; // Prepare for display
        console.log(`[${callId}] useSendMessage: Query optimized to: "${queryForProcessing}"`);
   } else {
    processedQueryDisplay = `**ORG:** (${queryForProcessing})\n\n`;
    console.log(`[${callId}] useSendMessage: Using original query: "${queryForProcessing}"`);
 }
}  else {
  queryForProcessing = message;
}

    // --- Step 2: Perform Web Search ---
    if (performSearch) {
      console.log(`[${callId}] useSendMessage: Performing web search...`);
      searchRes = await webSearch(queryForProcessing, config.webMode || 'google').catch(/* ... */);
      console.log(`[${callId}] useSendMessage: Web search done. Length: ${searchRes.length}`);
   }

    // Use the potentially optimized query for subsequent steps if web search was done
    const messageToUse = performSearch ? queryForProcessing : message;

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
      status: 'complete', // Set to complete initially
      webDisplayContent: combinedWebContentDisplay, // Store the prefix info here!
      timestamp: Date.now() + 1 // Ensure slightly later timestamp
    };
    setTurns(prevTurns => [...prevTurns, assistantTurnPlaceholder]);
    console.log(`[${callId}] useSendMessage: Assistant placeholder turn added.`);

    // --- Step 4: Execute based on Compute Level ---
    try {
      if (config?.computeLevel === 'high' && currentModel) { // Keep currentModel check
        console.log(`[${callId}] useSendMessage: Starting HIGH compute level.`);
        // Pass messageToUse (potentially optimized) to handleHighCompute
        await handleHighCompute(
          messageToUse,
          currentTurns, // Pass history for context if needed inside handleHighCompute
          config,
          currentModel,
          authHeader,
          (update, isFinished) => {
            // Update the last (assistant) turn
            setTurns(prevTurns => {
              if (prevTurns.length === 0 || prevTurns[prevTurns.length - 1].role !== 'assistant') return prevTurns;
              const lastTurn = prevTurns[prevTurns.length - 1];
              return [
                ...prevTurns.slice(0, -1),
                {
                  ...lastTurn,
                  rawContent: update, // Update with progress or final result
                  status: isFinished ? 'complete' : 'streaming',
                  timestamp: Date.now()
                }
              ];
            });
          }
        );
        console.log(`[${callId}] useSendMessage: HIGH compute level finished.`);
      } else if (config?.computeLevel === 'medium' && currentModel) {
        console.log(`[${callId}] useSendMessage: Starting MEDIUM compute level.`);
        await handleMediumCompute(
          messageToUse,
          currentTurns,
          config,
          currentModel,
          authHeader,
          (update, isFinished) => {
            // Update the last (assistant) turn (same logic as high)
            setTurns(prevTurns => {
              if (prevTurns.length === 0 || prevTurns[prevTurns.length - 1].role !== 'assistant') return prevTurns;
              const lastTurn = prevTurns[prevTurns.length - 1];
              return [
                ...prevTurns.slice(0, -1),
                {
                  ...lastTurn,
                  rawContent: update,
                  status: isFinished ? 'complete' : 'streaming',
                  timestamp: Date.now()
                }
              ];
            });
          }
        );
        console.log(`[${callId}] useSendMessage: MEDIUM compute level finished.`);
      } else {
        // --- Standard Streaming Call (Low Compute or Default) ---
        console.log(`[${callId}] useSendMessage: Starting standard streaming.`);
        const normalizedUrl = normalizeApiEndpoint(config?.customEndpoint);
        const configBody = { stream: true };
        const urlMap: Record<string, string> = {
          groq: 'https://api.groq.com/openai/v1/chat/completions',
          ollama: `${config?.ollamaUrl || ''}/api/chat`,
          gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
          lmStudio: `${config?.lmStudioUrl || ''}/v1/chat/completions`,
          openai: 'https://api.openai.com/v1/chat/completions',
          openrouter: 'https://openrouter.ai/api/v1/chat/completions',
          custom: config?.customEndpoint ? `${normalizedUrl}/v1/chat/completions` : '',
        };
        const host = currentModel.host || '';
        const url = urlMap[host];

        if (!url || !currentModel) { // Add currentModel check
          throw new Error(`Could not determine API URL for host: ${currentModel.host}`);
        }

        console.log(`[${callId}] useSendMessage: Sending chat request to ${url}`);
        await fetchDataAsStream(
          url,
          {
            ...configBody,
            model: config?.selectedModel || '',
            messages: [
              { role: 'system', content: systemContent },
              ...messageForApi // Use the history + original user message
            ],
            temperature: config?.temperature ?? 0.7,
            max_tokens: config?.maxTokens ?? 2048,
            top_p: config?.topP ?? 1,
            presence_penalty: config?.presencePenalty ?? 0,
          },
          (part: string, isFinished?: boolean, isError?: boolean) => {
            // Only process if this is the active call
            if (completionGuard.current !== callId) return;

            setTurns(prevTurns => {
              if (prevTurns.length === 0 || prevTurns[prevTurns.length - 1].role !== 'assistant') return prevTurns;
              const lastTurn = prevTurns[prevTurns.length - 1];
              const updatedContent = isError ? `Error: ${part || 'Unknown stream error'}` : part;
              const updatedStatus = isError ? 'error' : (isFinished ? 'complete' : 'streaming');

              return [
                ...prevTurns.slice(0, -1),
                { ...lastTurn, rawContent: updatedContent, status: updatedStatus }
              ];
            });

            if (isFinished || isError) {
              console.log(`[${callId}] fetchDataAsStream Callback: Stream finished/errored.`);
              setLoading(false);
              completionGuard.current = null; // Allow next send
              console.log(`[${callId}] --- Stream finished processing COMPLETE ---`);
            }
          },
          authHeader,
          currentModel.host || ''
        );
        console.log(`[${callId}] useSendMessage: fetchDataAsStream call INITIATED.`);
      }
    } catch (error) {
      console.error(`[${callId}] useSendMessage: Error during send operation:`, error);
      // Update the last turn with error status
      setTurns(prevTurns => {
        if (prevTurns.length === 0 || prevTurns[prevTurns.length - 1].role !== 'assistant') return prevTurns;
        const lastTurn = prevTurns[prevTurns.length - 1];
        return [
          ...prevTurns.slice(0, -1),
          { ...lastTurn, rawContent: `Error: ${error instanceof Error ? error.message : String(error)}`, status: 'error' }
        ];
      });
    } finally {
      // Ensure loading is always set to false and guard is cleared if the process wasn't streaming
      if (config?.computeLevel === 'high' || config?.computeLevel === 'medium') {
        console.log(`[${callId}] useSendMessage: Finalizing HIGH compute level state.`);
         setLoading(false);
         completionGuard.current = null; // Allow next send
      } else if (completionGuard.current === callId) {
        // If it was a streaming call but finished abruptly or errored before the callback cleared it
        // setLoading(false); // Should be handled by the callback's isFinished/isError
        // completionGuard.current = null;
        console.log(`[${callId}] useSendMessage: Stream completion/error should handle final state.`);
      }
     }
   };
 

  return onSend;
}
// --- Export the hook ---

export default useSendMessage;

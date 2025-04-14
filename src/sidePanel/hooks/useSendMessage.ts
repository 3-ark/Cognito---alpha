import { Dispatch, SetStateAction } from 'react';

import { fetchDataAsStream, webSearch } from '../network';

// --- Define Interfaces ---

// Define the structure of your model objects
interface Model {
  id: string;
  host?: 'groq' | 'ollama' | 'gemini' | 'lmStudio' | 'openai' | string; // Add other potential hosts
  active?: boolean;

  // Add any other properties your model objects might have
}

// Define the structure of your configuration object
interface Config {
  chatMode?: 'web' | 'page' | string; // Add other modes
  webMode?: 'brave' | 'google' | 'duckduckgo' | string; // Define more specific types if possible
  generateTitle?: boolean;
  personas: Record<string, string>; // Assumes personas are string instructions keyed by name
  persona: string; // The key for the selected persona
  models?: Model[];
  selectedModel?: string; // The ID of the selected model
  contextLimit?: number;
  webLimit?: number;
  ollamaUrl?: string;
  lmStudioUrl?: string;
  groqApiKey?: string;
  geminiApiKey?: string;
  openAiApiKey?: string;
  pageMode?: string;

  // Add any other config properties
}

// Define the structure for messages sent to the API
interface ApiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// --- Type Hook Parameters ---
const useSendMessage = (
  isLoading: boolean,
  originalMessage: string,
  messages: string[],
  webContent: string, // Assuming webContent is always a string based on usage
  config: Config | null | undefined, // Allow config to be potentially null/undefined initially
  setMessages: Dispatch<SetStateAction<string[]>>,
  setMessage: Dispatch<SetStateAction<string>>,
  setResponse: Dispatch<SetStateAction<string>>,
  setWebContent: Dispatch<SetStateAction<string>>,
  setPageContent: Dispatch<SetStateAction<string>>, // Assuming string based on usage
  setLoading: Dispatch<SetStateAction<boolean>>
) => {
  const onSend = async (overridedMessage?: string) => {
    const message = overridedMessage || originalMessage;

    if (isLoading || !message || !config) return; // Added check for config

    setLoading(true);

    let searchRes: string = ''; // Explicitly type searchRes
    const performSearch = config?.chatMode === 'web';

    if (performSearch) {
      setWebContent('');

      // Assuming webSearch returns a Promise<string>
      searchRes = await webSearch(message, config?.webMode);
    }

    // Type the map callback parameters and ensure content is string
    const currentMessages: ApiMessage[] = [message, ...messages]
      .map((m: string, i: number): ApiMessage => ({ // Type 'm' and 'i', and return type
        content: m || '', // Ensure content is always a string
        role: i % 2 === 1 ? 'assistant' : 'user'
      }))
      .reverse();

    const newMessages = ['', message, ...messages];

    setMessages(newMessages);
    setMessage('');
    setResponse('');

    const persona = config?.personas?.[config?.persona] || ''; // Default to empty string if not found

    // Handle JSON.parse safely - it returns 'any'
    let pageString: unknown;
    let pageHtml: unknown;

    try {
      pageString = JSON.parse(localStorage.getItem('pagestring') || '""'); // Default to empty JSON string
      pageHtml = JSON.parse(localStorage.getItem('pagehtml') || '""');
    } catch (e) {
      console.error("Failed to parse page content from localStorage", e);
      pageString = "";
      pageHtml = "";
    }

    // Use type guards or assertions if you expect a specific type (here assuming string)
    const pageStringContent = typeof pageString === 'string' ? pageString : '';
    const pageHtmlContent = typeof pageHtml === 'string' ? pageHtml : '';

    const altTexts = JSON.parse(localStorage.getItem('alttexts') || '""');
    const tableData = JSON.parse(localStorage.getItem('tabledata') || '""');

    const currentPageContent = config?.chatMode === 'page' &&
      !window.location.href.startsWith('chrome://') &&
      (config?.pageMode === 'html' ? pageHtmlContent : pageStringContent);

    const charLimit = 1000 * (config?.contextLimit || 1);

    // Ensure substr is called on a string
    const limitedContent = charLimit && typeof currentPageContent === 'string' ? currentPageContent.substr(0, charLimit) : '';
    const unlimitedContent = config?.contextLimit === 128 && currentPageContent;

    const webLimit = 1000 * (config?.webLimit || 1);

    // Ensure substr is called on a string
    const limitedWebResult = webLimit && typeof searchRes === 'string' ? searchRes.substr(0, webLimit) : '';
    const unlimitedWebresults = config?.webLimit === 128 && searchRes;

    const finalWebContent = unlimitedWebresults || limitedWebResult || ''; // Default to empty string

    // No need for 'as string' if defaulting to empty string
    setWebContent(finalWebContent);

    const pageContentForState = unlimitedContent || limitedContent || ''; // Default to empty string

    setPageContent(pageContentForState);

    const pageChat = pageContentForState;
    const webChat = finalWebContent;

    const content = `
      ${persona}
      ${pageChat ? `. here is the page content: ${pageChat}` : ''}
      ${webChat ? `. here is a quick web search result about the topic (refer to this as your quick web search): ${webChat}` : ''}
    `.trim(); // Trim whitespace

    const configBody = { stream: true };

    // Correctly type the find callback parameter
    const currentModel = config?.models?.find((model: Model) => model.id === config?.selectedModel);

    console.log(currentModel);

    // Type the URL mapping keys
    const urlMap: Record<string, string> = {
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      ollama: `${config?.ollamaUrl || ''}/api/chat`, // Add default empty string
      gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      lmStudio: `${config?.lmStudioUrl || ''}/v1/chat/completions`, // Add default empty string
      openai: 'https://api.openai.com/v1/chat/completions'
    };
    const url = urlMap[currentModel?.host || ''] || ''; // Default to empty string if host not found

    if (!url) {
      console.error("Could not determine API URL for host:", currentModel?.host);
      setLoading(false);

      return; // Stop execution if URL is invalid
    }

    let authHeader: Record<string, string> | undefined; // Type authHeader

    if (currentModel?.host === 'groq' && config.groqApiKey) {
      authHeader = { Authorization: `Bearer ${config.groqApiKey}` };
    } else if (currentModel?.host === 'gemini' && config.geminiApiKey) {
      authHeader = { Authorization: `Bearer ${config.geminiApiKey}` };
    } else if (currentModel?.host === 'openai' && config.openAiApiKey) {
      authHeader = { Authorization: `Bearer ${config.openAiApiKey}` };
    }

    // Assuming fetchDataAsStream callback provides string and boolean
    fetchDataAsStream(
      url,
      {
        ...configBody,
        model: config?.selectedModel || '', // Default to empty string
        messages: [
          { role: 'system', content },
          ...currentMessages
        ]
      },
      (part: string, isFinished: boolean) => {
        // No explicit 'any' here, assuming fetchDataAsStream is typed correctly internally
        // or its types are inferred. Ensure 'part' is treated as a string.
        const responsePart = part || ''; // Ensure part is a string

        if (isFinished) {
          setResponse(responsePart);
          setLoading(false);
        } else {
          setResponse(responsePart);
        }
      },
      authHeader,
      currentModel?.host
    );
  };

  return onSend;
};

export default useSendMessage;

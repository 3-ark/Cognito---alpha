// Fetching data using readable stream
import { events } from 'fetch-event-stream';
import { cleanUrl } from './WebSearch';

interface ApiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
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

// Add helper function to clean response from thinking blocks
const cleanResponse = (response: string): string => {
  return response
    .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove thinking blocks with content
    .replace(/["']/g, '') // Remove quotes
    .trim();
};

export const processQueryWithAI = async (
  query: string,
  config: Config,
  currentModel: Model,
  authHeader?: Record<string, string>,
  contextMessages: ApiMessage[] = []
): Promise<string> => {
  try {
   // Ensure currentModel and host exist before trying to get the URL
   if (!currentModel?.host) {
    console.error('processQueryWithAI: currentModel or currentModel.host is undefined. Cannot determine API URL.');
    return query; // Fallback to original query
  }

  // --- CHANGE 2: Format context messages for the prompt ---
  const formattedContext = contextMessages
      .map(msg => `{{${msg.role}}}: ${msg.content}`) // Format as {{role}}: content
      .join('\n');     
  // System prompt to optimize queries
  const systemPrompt = `You are a Google search query optimizer. Your task is to rewrite user's input [The user's raw input && chat history:${formattedContext}].
\n
Instructions:
**Important** No Explanation, just the optimized query!
\n
1. Extract the key keywords and named entities from the user's input.
2. Correct any obvious spelling errors.
3. Remove unnecessary words (stop words) unless they are essential for the query's meaning.
4. If the input is nonsensical or not a query, return the original input.
5. Using previous chat history to understand the user's intent.
\n
Output:
'The optimized Google search query'
\n
Example 1:
Input from user ({{user}}): where can i find cheep flights to london
Output:
'cheap flights London'
\n
Example 2:
Context: {{user}}:today is a nice day in paris i want to have a walk and find a restaurant to have a nice meal. {{assistant}}: Bonjour, it's a nice day!
Input from user ({{user}}): please choose me the best restaurant 
Output:
'best restaurants Paris France'
\n
Example 3:
Input from user ({{user}}): asdf;lkjasdf
Output:
'asdf;lkjasdf'
`;

    const urlMap: Record<string, string> = {
      groq: 'https://api.groq.com/openai/v1/chat/completions',
      ollama: `${config?.ollamaUrl || ''}/api/chat`, // Add default empty string
      gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      lmStudio: `${config?.lmStudioUrl || ''}/v1/chat/completions`, // Add default empty string
      openai: 'https://api.openai.com/v1/chat/completions'
    };
    const apiUrl = urlMap[currentModel.host];
    if (!apiUrl) {
      console.error('processQueryWithAI: Could not determine API URL for host:', currentModel.host);
      return query; // Fallback to original query
    }

    console.log(`processQueryWithAI: Using API URL: ${apiUrl} for host: ${currentModel.host}`); 
    // console.log('Chat history context:', contextMessages);
    console.log('Formatted Context for Prompt:', formattedContext); // Debug log

    const requestBody = {
      model: config?.selectedModel || '',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      stream: false // Explicitly set stream to false
    };

    // Adjust fetch options based on host if necessary (e.g., Gemini might need different body/headers)
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(authHeader || {}) // Spread authHeader if it exists
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`API request failed with status ${response.status}: ${errorBody}`);
        throw new Error(`API request failed: ${response.statusText}`);
    }

    const responseData = await response.json();
    const rawContent = responseData?.choices?.[0]?.message?.content;
    return typeof rawContent === 'string' 
      ? cleanResponse(rawContent)
      : query;

  } catch (error) {
    console.error('processQueryWithAI: Error during execution:', error);
    return query;
  }
};

export const urlRewriteRuntime = async function (domain: string) {
  try {
    const url = new URL(domain);
    if (url.protocol === 'chrome:') return;
    
    const domains = [url.hostname];
    const origin = `${url.protocol}//${url.hostname}`;

    const rules = [
      {
        id: 1,
        priority: 1,
        condition: { requestDomains: domains },
        action: {
          type: 'modifyHeaders',
          requestHeaders: [
            {
              header: 'Origin',
              operation: 'set',
              value: origin
            }
          ]
        }
      }
    ];

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map(r => r.id),
      addRules: rules
    });
  } catch (error) {
    console.debug('URL rewrite skipped:', error);
  }
};

export const webSearch = async (query: string, webMode: string) => {
  const baseUrl = webMode === 'brave'
    ? `https://search.brave.com/search?q=${encodeURIComponent(query)}`
    : webMode === 'google'
      ? `https://www.google.com/search?q=${encodeURIComponent(query)}`
      : `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 15000);

  try {
    const response = await fetch(baseUrl, {
      signal: abortController.signal,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Referer': 'https://search.brave.com/'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Web search failed with status: ${response.status}`);
    }

    const htmlString = await response.text();
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(htmlString, 'text/html');

    // Clean up unnecessary elements
    htmlDoc.querySelectorAll(
      'script, style, nav, footer, header, svg, img, noscript, iframe, form, .modal, .cookie-banner'
    ).forEach(el => el.remove());

    let resultsText = '';
    
    if (webMode === 'duckduckgo') {
      // DuckDuckGo's current structure
      const results = htmlDoc.querySelectorAll('.web-result');
      results.forEach(result => {
        const title = result.querySelector('.result__a')?.textContent?.trim();
        const snippet = result.querySelector('.result__snippet')?.textContent?.trim();
        if (title) resultsText += `${title}\n${snippet || ''}\n\n`;
      });
    } else if (webMode === 'google') {
      // Google's current structure
      const results = htmlDoc.querySelectorAll('.MjjYud');
      results.forEach(result => {
        const title = result.querySelector('h3')?.textContent?.trim();
        const snippet = Array.from(result.querySelectorAll('div[class*="VwiC3b"] > span'))
        .map(span => {
          const timestampSpan = span.querySelector('.YrbPuc span');
          if (timestampSpan) {
            const timestamp = timestampSpan.textContent?.trim();
            const timeAgo = timestamp ? `[${timestamp}] ` : '';

            // Get remaining text after timestamp (including the dash)
            const postTimestamp = span.textContent
              ?.replace(timestamp || '', '')
              .replace(/^—\s*/, ': ') // Convert leading dash to colon
              .trim();

            return timeAgo + postTimestamp;
          }

          return Array.from(span.childNodes)
            .map(node => {
              if (node.nodeType === Node.TEXT_NODE) return node.textContent;
              if (node.nodeName === 'EM') return `*${node.textContent}*`;
              return node.textContent;
            })
            .join('')
            .replace(/\u00A0/g, ' ')
            .trim();
        })
        .filter(text => text)
        .join(' ') 
        .replace(/\s+/g, ' ');

        if (title) {
          resultsText += `${title}\n${snippet || ''}\n\n`;}
      });
      console.log('Google Result Structure:', resultsText);

    } else if (webMode === 'brave') {
      // Brave's updated structure
      const braveResults = htmlDoc.querySelectorAll('#results .snippet');
      braveResults.forEach(result => {
        const link = result.querySelector('a[href]');
        const url = link?.getAttribute('href')?.trim();
        const title = link?.querySelector('.title.mt-s')?.textContent?.trim();
        const snippet = result.querySelector('.snippet-description')?.textContent?.trim();
    
        if (title) {
          resultsText += `**${title}**\n${url ? url + '\n' : ''}${snippet || ''}\n\n`;
        }
      });
    
      // Fallback to legacy organic results
      if (!braveResults.length) {
        htmlDoc.querySelectorAll('.organic-result').forEach(result => {
          const title = result.querySelector('h3')?.textContent?.trim();
          const snippet = result.querySelector('.snippet-content')?.textContent?.trim();
          if (title) resultsText += `${title}\n${snippet || ''}\n\n`;
        });
      }
    }
    console.log('Brave Result Structure:', resultsText);
    return resultsText.trim() || 'No results found';
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('Web search failed:', error);
    return '';
  }
  
};

export async function fetchDataAsStream(
  url: string,
  data: Record<string, unknown>,
  onMessage: (message: string, done?: boolean, error?: boolean) => void, // Added optional error flag
  headers: Record<string, string> = {},
  host: string
) {
  let streamFinished = false; // Flag to prevent multiple final calls

  // Helper to call final message exactly once
  const finishStream = (message: string, isError: boolean = false) => {
    if (!streamFinished) {
      streamFinished = true;
      // Ensure message is a string, even if error object is passed accidentally
      const finalMessage = typeof message === 'string' ? message : (message instanceof Error ? message.message : String(message));
      onMessage(finalMessage, true, isError); // Pass done=true and error status
    }
  };

  // --- Your Original URL Checks (Correct Placement) ---
  if (url.startsWith('chrome://')) {
    console.log("fetchDataAsStream: Skipping chrome:// URL:", url);
    // Optionally call finishStream with an appropriate message/error if needed
    // finishStream("Skipped chrome:// URL", true); // Or perhaps just return void silently?
    return; // Skip chrome:// URLs
  }

  if (url.includes('localhost')) {
    // Assuming cleanUrl is defined elsewhere
    await urlRewriteRuntime(cleanUrl(url));
  }
  // --- End Original URL Checks ---

  // --- Main Try/Catch for Fetch and Streaming ---
  try {
    // --- Your Original Fetch Setup (Correct Placement) ---
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data)
      // Consider adding AbortController for timeouts if needed here too
    });
    // --- End Original Fetch Setup ---

    // Check if the fetch itself failed
    if (!response.ok) {
      // Try to get error details from the body
      let errorBody = `Network response was not ok (${response.status})`;
      try {
         const text = await response.text();
         errorBody += `: ${text || response.statusText}`;
      } catch (_) {
         // Ignore if reading body fails
         errorBody += `: ${response.statusText}`;
      }
      throw new Error(errorBody);
    }

    // --- Start Stream Processing ---
    let str = ''; // Accumulator for the response string

    // --- Refined Host-Specific Stream Logic ---
    if (host === "ollama") {
        if (!response.body) throw new Error('Response body is null for Ollama');
        const reader = response.body.getReader();
        let done, value;
        while (true) {
          ({ value, done } = await reader.read());
          if (done) break; // Exit loop if stream ends naturally
          const chunk = new TextDecoder().decode(value);

          // Split potential multiple JSON objects in one chunk (Ollama might do this)
          const jsonObjects = chunk.split('\n').filter(line => line.trim() !== '');

          for (const jsonObjStr of jsonObjects) {
             if (jsonObjStr.trim() === '[DONE]') { // Check for [DONE] marker if Ollama uses it
                finishStream(str);
                return; // Exit function completely
             }
             try {
                const parsed = JSON.parse(jsonObjStr);
                if (parsed.message?.content) {
                  str += parsed.message.content;
                  if (!streamFinished) onMessage(str); // Send intermediate update
                }
                // Check for Ollama's own 'done' flag within the JSON
                if (parsed.done === true && !streamFinished) {
                   finishStream(str);
                   return; // Exit function completely
                }
             } catch (error) {
                console.debug('Skipping invalid JSON chunk:', jsonObjStr);
             }
          }
        }
        // If loop finished naturally (done=true reading stream)
        finishStream(str);

      } else if (["lmStudio", "groq", "gemini", "openai"].includes(host)) {
        // Using fetch-event-stream for SSE
        const stream = events(response); // Assuming 'events' is correctly imported
        for await (const event of stream) {
          if (streamFinished) continue;
          if (!event.data) continue;

          // Handle [DONE] marker (relevant for non-OpenAI)
          if (event.data.trim() === '[DONE]') {
            finishStream(str);
            break; // Exit SSE loop
          }

          try {
            const received = JSON.parse(event.data);
            let apiError = null; // Check for API-reported errors in payload
            if (host === 'groq' && received?.x_groq?.error) apiError = received.x_groq.error;
            else if (host === 'gemini' && received?.error) apiError = received.error.message || JSON.stringify(received.error); // Gemini might use standard 'error' field in OpenAI compat mode
            else if (received?.error) apiError = received.error.message || JSON.stringify(received.error); // General OpenAI structure

            if (apiError) {
               throw new Error(`API Error: ${apiError}`);
            }

            str += received?.choices?.[0]?.delta?.content || '';
            if (!streamFinished) onMessage(str); // Send intermediate update

          } catch (error) {
            if (error instanceof Error && error.message.startsWith('API Error:')) {
               // If we already parsed an API error message, finish with error
               finishStream(error.message, true); // Mark as error
            } else {
               // Log JSON parse errors but potentially continue if minor
               console.debug('Skipping invalid SSE chunk or parse error:', event.data, error);
            }
            // Decide if a parse error should terminate the stream or just be skipped
            // continue; // Or: finishStream(`Parse Error: ${error}`, true); break;
          }
        }
        // If SSE loop finished naturally (stream closed by server)
        finishStream(str);

      } else {
         // Handle unknown host
         throw new Error(`Unsupported host specified: ${host}`);
      }
      // --- End Stream Processing ---

  } catch (error) {
    // Catch errors from fetch, response.ok check, or stream processing
    console.error('Error in fetchDataAsStream:', error);
    finishStream(error instanceof Error ? error.message : String(error), true); // Finish with error state
  }
}
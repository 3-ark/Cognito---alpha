// Fetching data using readable stream
import { events } from 'fetch-event-stream';
import { cleanUrl } from './WebSearch';
// network.tsx
export const processQueryWithAI = async (
  query: string,
  config: Config,
  currentModel: Model,
  authHeader?: Record<string, string>,
  contextMessages: string[] = []
): Promise<string> => {
  try {
   // Ensure currentModel and host exist before trying to get the URL
   if (!currentModel?.host) {
    console.error('processQueryWithAI: currentModel or currentModel.host is undefined. Cannot determine API URL.');
    return query; // Fallback to original query
  }

  // System prompt to optimize queries
  const systemPrompt = `You are a Google search query optimizer. Your task is to rewrite user's input [The user's raw input && chat history:${contextMessages.join('\n')}].
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
    // console.log('Full system prompt:', systemPrompt); console logs, for debugging

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
    const optimizedContent = responseData?.choices?.[0]?.message?.content;
    return typeof optimizedContent === 'string' ? optimizedContent.trim().replace(/["']/g, '') : query;
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
    } 
    else if (webMode === 'brave') {
      // First try new layout
      const braveResults = htmlDoc.querySelectorAll('.snippet, .snippet-wrapper, [data-loc="rw"]');
      
      braveResults.forEach(result => {
        const title = result.querySelector('.title, .snippet-title, h3, [data-testid="mainline"] h3')?.textContent?.trim();
        const url = result.querySelector('.url, .snippet-url, .result-header')?.textContent?.trim();
        const snippet = result.querySelector('.snippet-description, .description, .result-snippet')?.textContent?.trim();
    
        if (title) {
          resultsText += `**${title}**\n${url ? url + '\n' : ''}${snippet || ''}\n\n`;
        }
      });
    
      // Fallback to organic results
      if (!braveResults.length) {
        htmlDoc.querySelectorAll('.organic-result').forEach(result => {
          const title = result.querySelector('h3')?.textContent?.trim();
          const snippet = result.querySelector('.snippet-content')?.textContent?.trim();
          if (title) resultsText += `${title}\n${snippet || ''}\n\n`;
        });
      }
    }

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
  onMessage: (message: string, done?: boolean) => void,
  headers: Record<string, string> = {},
  host: string
) {
  
  if (url.startsWith('chrome://')) {
    return; // Skip chrome:// URLs
  }

  if (url.includes('localhost')) {
    await urlRewriteRuntime(cleanUrl(url));
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    let str = '';

    if (host === "ollama") {
      if (!response.body) return;

      const reader = response.body.getReader();

      let done;
      let value;

      while (!done) {
        ({ value, done } = await reader.read());

        if (done) {
          onMessage(str, true);
          break;
        }

        const chunk = new TextDecoder().decode(value);

        // Handle [DONE] marker
        if (chunk.trim() === '[DONE]') {
          onMessage(str, true);
          break;
        }

        try {
          const parsed = JSON.parse(chunk);

          if (parsed.message?.content) {
            str += parsed.message.content;
            onMessage(str);
          }
        } catch (error) {
          // Ignore JSON parse errors for non-JSON chunks
          console.debug('Skipping invalid JSON chunk:', chunk);
          continue;
        }
      }
    }

    if (host === "lmStudio") {
      const stream = events(response);

      for await (const event of stream) {
        if (!event.data) continue;

        // Handle [DONE] marker
        if (event.data.trim() === '[DONE]') {          onMessage(str, true);

          break;
        }

        try {
          const received = JSON.parse(event.data || '');
          const err = received?.x_groq?.error;

          if (err) {
            onMessage(`Error: ${err}`, true);

            return;
          }

          str += received?.choices?.[0]?.delta?.content || '';
          onMessage(str || '');
        } catch (error) {
          // Skip invalid JSON chunks
          console.debug('Skipping invalid chunk:', event.data);
          continue;
        }
      }
    }

    if (host === "groq") {
      const stream = events(response);

      for await (const event of stream) {
        if (!event.data) continue;

        // Handle [DONE] marker
        if (event.data.trim() === '[DONE]') {          onMessage(str, true);

          break;
        }

        try {
          const received = JSON.parse(event.data || '');
          const err = received?.x_groq?.error;

          if (err) {
            onMessage(`Error: ${err}`, true);

            return;
          }

          str += received?.choices?.[0]?.delta?.content || '';
          onMessage(str || '');
        } catch (error) {
          // Skip invalid JSON chunks
          console.debug('Skipping invalid chunk:', event.data);
          continue;
        }
      }
    }

    if (host === "gemini") {
      const stream = events(response);

      for await (const event of stream) {
        if (!event.data) continue;

        // Check if the event data is exactly '[DONE]'
        if (event.data.trim() === '[DONE]') {
          onMessage(str, true);
          break;
        }

        try {
          // Only try to parse if it looks like JSON
          if (typeof event.data === 'string' && event.data.startsWith('{')) {
            const received = JSON.parse(event.data);
            const err = received?.x_gemini?.error;

            if (err) {
              onMessage(`Error: ${err}`, true);

              return;
            }

            str += received?.choices?.[0]?.delta?.content || '';
            onMessage(str || '');
          }
        } catch (error) {
          // Skip invalid chunks silently
          console.debug('Skipping invalid chunk');
          continue;
        }
      }
    }

    if (host === "openai") {
      const stream = events(response);

      for await (const event of stream) {
        if (!event.data) continue;

        try {
          const received = JSON.parse(event.data || '');
          const err = received?.x_openai?.error;

          if (err) {
            onMessage(`Error: ${err}`, true);

            return;
          }

          str += received?.choices?.[0]?.delta?.content || '';

          onMessage(str || '');
        } catch (error) {
          onMessage(`${error}`, true);
          console.error('Error fetching data:', error);
        }
      }
    }

    onMessage(str, true);
  } catch (error) {
    onMessage(`${error}`, true);
    console.error('Error fetching data:', error);
  }
}

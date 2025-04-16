// Fetching data using readable stream
import { events } from 'fetch-event-stream';

// network.tsx
export const processQueryWithAI = async (
  query: string,
  config: Config,
  currentModel: Model,
  authHeader?: Record<string, string>
): Promise<string> => {
  try {
   // Ensure currentModel and host exist before trying to get the URL
   if (!currentModel?.host) {
    console.error('processQueryWithAI: currentModel or currentModel.host is undefined. Cannot determine API URL.');
    return query; // Fallback to original query
  }

  // System prompt to optimize queries
  const systemPrompt = `You're a search query optimizer. Convert this into an optimized query for google.
Format as: "optimized_query" (in quotes). Never explain.`;

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

    console.log(`processQueryWithAI: Using API URL: ${apiUrl} for host: ${currentModel.host}`); // Added logging
    
    // --- Direct Fetch for Non-Streaming ---
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
        console.error(`processQueryWithAI: API request failed with status ${response.status}: ${errorBody}`);
        throw new Error(`API request failed: ${response.statusText}`);
    }

    const responseData = await response.json();

    // --- Extract Content based on expected response structure ---
    const optimizedContent = responseData?.choices?.[0]?.message?.content;

    if (typeof optimizedContent === 'string' && optimizedContent.trim()) {
        const processedQuery = optimizedContent.trim().replace(/["']/g, ''); // Remove quotes
        console.log('processQueryWithAI: Query processed successfully:', processedQuery);
        return processedQuery;
    } else {
        console.error('processQueryWithAI: Could not extract optimized query from response:', responseData);
        return query; // Fallback if content extraction fails
    }
    // --- End Direct Fetch ---

  } catch (error) {
    // Log the specific error that occurred within the try block
    console.error('processQueryWithAI: Error during execution, using original query:', error);
    return query; // Fallback to original
  }
};

// Prevent XSS in HTML content
const sanitizeHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const whitelist = ['b','i','em','strong','p','br'];
  
  doc.body.querySelectorAll('*').forEach(node => {
    if (!whitelist.includes(node.tagName.toLowerCase())) {
      node.remove();
    }
  });
  
  return doc.body.innerHTML;
};

export const urlRewriteRuntime = async function (
  domain: string
) {
  try {
    const url = new URL(domain);

    // Skip chrome:// URLs
    if (url.protocol === 'chrome:') {
      return;
    }
    
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
      : `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const isPost = webMode === 'duckduckgo';
  const method = isPost ? 'POST' : 'GET';

  let body: FormData | undefined = undefined;
  if (isPost) {
    body = new FormData();
    body.append('q', query);
  }

  // Consider if urlRewriteRuntime is needed here for Brave/Google/DDG. It might not be.
  // await urlRewriteRuntime(cleanUrl(baseUrl));

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), 15000);

  try {
    const response = await fetch(
      isPost ? 'https://html.duckduckgo.com/html/' : baseUrl,
      {
        signal: abortController.signal,
        method: method,
        body: body,
        headers: {
          // Add necessary headers if requests fail
        }
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Web search failed with status: ${response.status}`);
    }

    const htmlString = await response.text();

    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(htmlString, 'text/html');

    htmlDoc.querySelectorAll('svg, #header, style, link[rel="stylesheet"], script, input, option, select, form, nav, footer, [role="alert"], [aria-hidden="true"]').forEach(item => item.remove());

    return htmlDoc.body.innerText.replace(/\s\s+/g, ' ').trim();

  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('Web search timed out.');
    } else {
      console.error('Web search failed:', error);
    }
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

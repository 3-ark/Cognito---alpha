export async function getCurrentTab() {
  const queryOptions = { active: true, lastFocusedWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

export async function injectContentScript(tabId: number) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      console.debug('Skipping content script injection for restricted URL:', tab.url);
      return;
    }
    console.log('injecting content script');
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['assets/vendor.js', 'content.js']
    }).catch(err => {
      console.debug('Script injection failed:', err);
    });
  } catch (err) {
    console.debug('Tab access failed:', err);
    return;
  }
}

/**
 * Normalizes a custom API endpoint URL to extract its origin (scheme + hostname + port).
 * Strips any path, query parameters, or hash. Handles common variations.
 * @param endpoint - The user-provided endpoint URL string.
 * @returns The normalized base URL (origin) or an empty string if input is invalid or empty.
 */
export const normalizeApiEndpoint = (endpoint?: string): string => {
  if (!endpoint) {
    return ''; // Return empty for empty/undefined input
  }

  let urlStr = endpoint.trim(); // Trim whitespace

  // The URL constructor requires a scheme (like http:// or https://).
  // Prepend https:// if it's missing, unless it looks like a local address.
  if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
     // Simple check for localhost or IP addresses - assume http for these
     if (urlStr.startsWith('localhost') || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(urlStr.split(':')[0])) {
        urlStr = 'http://' + urlStr;
     } else {
        // Otherwise, default to https for domain-like names
        urlStr = 'https://' + urlStr;
     }
  }

  try {
    // Use the URL constructor to parse the string
    const parsedUrl = new URL(urlStr);

    // The 'origin' property gives us exactly "scheme://hostname:port"
    // It automatically handles stripping paths, queries, hashes, and trailing slashes.
    return parsedUrl.origin;

  } catch (error) {
    // Log an error if the URL couldn't be parsed
    console.error(`Invalid URL provided for normalization: "${endpoint}". Could not parse as URL.`);
    // Return an empty string to indicate failure, preventing malformed URLs later
    return '';
  }
};

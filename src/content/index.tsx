import { contentLoaded } from 'src/state/slices/content';
import { createStoreProxy } from 'src/state/store';
import PortNames from '../types/PortNames';

(async () => {
  try {
    if (
      window.location.protocol === 'chrome:' ||
      window.location.protocol === 'chrome-extension:' ||
      window.location.href.includes('chrome.google.com')
    ) {
      console.debug('Skipping restricted URL:', window.location.protocol);
      return;
    }

    const store = createStoreProxy(PortNames.ContentPort);

    try {
      await store.ready();
      store.dispatch(contentLoaded());
    } catch (initError) {
      console.debug('Store initialization error:', initError);
    }
  } catch (err) {
    console.debug('Content script error:', err);
  }
})();

// Required for TypeScript module recognition
export {};
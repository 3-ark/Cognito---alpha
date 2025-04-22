import { contentLoaded } from 'src/state/slices/content';
import { createStoreProxy } from 'src/state/store';
import PortNames from '../types/PortNames';
import ContentProvider from './contracts/ContentProvider';

import CursorController from './controllers/CursorController';

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
    let controllers: ContentProvider[] = [];

    store.port.onDisconnect.addListener(() => {
      console.debug('Store port disconnected');
      controllers.forEach(controller => controller.cleanup?.());
      controllers = [];
    });

    store.subscribe(() => {
      const currentState = store.getState();
      const panelOpen = currentState.config?.panelOpen;

      if (panelOpen && !controllers.some(c => c instanceof CursorController)) {
        const cursorCtrl = new CursorController();
        controllers.push(cursorCtrl);
        cursorCtrl.register();
      } else if (!panelOpen && controllers.some(c => c instanceof CursorController)) {
        const cursorCtrl = controllers.find(c => c instanceof CursorController);
        if (cursorCtrl) {
          cursorCtrl.cleanup();
          controllers = controllers.filter(c => c !== cursorCtrl);
        }
      }
    });

    try {
      await store.ready();
      store.dispatch(contentLoaded());
    } catch (initError) {
      console.debug('Failed to initialize controllers:', initError);
    }
  } catch (err) {
    console.debug('Content script error:', err);
  }
})();

export {};

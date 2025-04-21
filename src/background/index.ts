import { getCurrentTab, injectContentScript } from 'src/background/util';
import buildStoreWithDefaults from 'src/state/store';
import storage from 'src/util/storageUtil';
import PortNames from '../types/PortNames';

// Initialize store but don't start any processes yet
buildStoreWithDefaults({ portName: PortNames.ContentPort });

// Set initial panel state
storage.setItem('panelOpen', false);

// Configure panel behavior
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error: unknown) => console.error(error));

// Only handle tab events when panel is open
chrome.runtime.onConnect.addListener(port => {
  let tabListenersActive = false;

  const handleTabActivated = async (activeInfo) => {
    if (await storage.getItem('panelOpen')) {
      console.log('tab activated with panel open: ', activeInfo.tabId);
      injectContentScript(activeInfo.tabId);
    }
  };

  const handleTabUpdated = async (tabId, changeInfo, tab) => {
    if (!(tab.id && changeInfo.status === 'complete')) return;
    
    if (await storage.getItem('panelOpen') && changeInfo.url) {
      console.log('tab updated with panel open:', tab.url);
      injectContentScript(tabId);
    }
  };

  const handleMessage = async msg => {
    try {
      if (port.name === PortNames.SidePanelPort) {
        if (msg.type === 'init') {
          console.log('panel opened');
          await storage.setItem('panelOpen', true);

          // Add tab listeners when panel opens
          if (!tabListenersActive) {
            chrome.tabs.onActivated.addListener(handleTabActivated);
            chrome.tabs.onUpdated.addListener(handleTabUpdated);
            tabListenersActive = true;
          }

          const tab = await getCurrentTab();
          if (tab?.id) {
            injectContentScript(tab.id);
          }

          port.postMessage({
            type: 'handle-init',
            message: 'panel open'
          });
        }
      }
    } catch (err) {
      console.debug('Port message handling error:', err);
    }
  };

  port.onMessage.addListener(handleMessage);
  
  // Clean up when panel closes
  port.onDisconnect.addListener(async () => {
    await storage.setItem('panelOpen', false);
    
    // Remove tab listeners when panel closes
    if (tabListenersActive) {
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      tabListenersActive = false;
    }
    
    port.onMessage.removeListener(handleMessage);
    console.log('panel closed, listeners removed');
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_PAGE_CONTENT') {
    sendResponse({
      title: document.title,
      text: document.body.innerText.replace(/\s\s+/g, ' '),
      html: document.body.innerHTML
    });
  }
  
  return true; // Keep connection open for response
});

export {};

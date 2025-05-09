// useSafeAsyncEffect.ts might be used in a different file, so ensure to import it correctly

import { useEffect, useRef } from 'react';

export function useSafeAsyncEffect(effect: (isCancelled: () => boolean) => void | Promise<void>, deps: React.DependencyList) {
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const maybePromise = effect(() => cancelledRef.current);

    return () => {
      cancelledRef.current = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}


// usage

// useSafeAsyncEffect(async (isCancelled) => {
//  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
//  if (isCancelled()) return;
  
//  if (tab?.id && tab.url) {
//    setCurrentTabInfo({ id: tab.id, url: tab.url });
//  }
//}, []);

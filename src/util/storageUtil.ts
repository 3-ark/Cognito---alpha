interface Storage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: unknown) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
}

const storage: Storage = typeof window !== 'undefined' && window.localStorage
  ? {
    getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
    setItem: (key: string, value: unknown) => {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      window.localStorage.setItem(key, stringValue);
      
      return Promise.resolve();
    },
    deleteItem: (key: string) => {
      window.localStorage.removeItem(key);
      
      return Promise.resolve();
    }
  }
  : {
    getItem: async (key: string) => {
      const data = await chrome.storage.local.get(key);
      const value = data[key]; // Could be anything

      // Attempt to serialize back to string, or return null in error
      try {
          return typeof value === 'string' ? value : JSON.stringify(value);
      } catch(e) {
          console.warn(`Could not serialize value for key ${key}`, e);
          
          return null; // Or handle the error differently
      }
    },
    setItem: async (key: string, value: unknown) => {
      const serializableValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      await chrome.storage.local.set({ [key]: serializableValue });
    },
    deleteItem: async (key: string) => {
      await chrome.storage.local.remove(key);
    }
  };

export default storage;

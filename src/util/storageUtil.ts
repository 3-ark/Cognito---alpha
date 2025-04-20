interface Storage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: unknown) => Promise<void>;
  deleteItem: (key: string) => Promise<void>;
}

const storage: Storage = {
  getItem: async (key: string) => {
    const data = await chrome.storage.local.get(key);
    const value = data[key];
    try {
      return typeof value === 'string' ? value : JSON.stringify(value);
    } catch (e) {
      return null;
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

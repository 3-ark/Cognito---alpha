import {
 useCallback,useEffect, useState 
} from 'react';
import storage from 'src/util/storageUtil';
import { useConfig } from '../ConfigContext';
import {
 GEMINI_URL, GROQ_URL, OPENAI_URL 
} from '../constants';

const fetchDataSilently = async (url: string, params = {}) => {
  try {
    const res = await fetch(url, params);
    const data = res.json();

    return data;
  } catch (error) {
    return undefined;
  }
};

export const useUpdateModels = () => {
  const [chatTitle, setChatTitle] = useState('');
  const { config, updateConfig } = useConfig();

  const fetchModels = useCallback(async () => {

    let models = [];

    if (config?.ollamaUrl) {
      const ollamaModels = await fetchDataSilently(`${config?.ollamaUrl}/api/tags`);

      if (!ollamaModels) {
        updateConfig({ ollamaConnected: false, ollamaUrl: '' });
      } else {
        const parsedModels = ollamaModels?.models?.map((m: unknown) => ({
 ...m, id: m.name, host: 'ollama' 
})) || [];

        models = [...models, ...parsedModels];
      }
    }

    if (config?.lmStudioUrl) {
      console.log('lm')
      const lmStudioModels = await fetchDataSilently(`${config?.lmStudioUrl}/v1/models`);

      console.log('lm', lmStudioModels)

      if (!lmStudioModels) {
        updateConfig({ lmStudioConnected: false, lmStudioUrl: '' });
      } else {
        const parsedModels = lmStudioModels?.data?.map((m: unknown) => ({ ...m, host: 'lmStudio' })) || [];

        models = [...models, ...parsedModels];
      }
    }

    if (config?.geminiApiKey) {
      const geminiModels = await fetchDataSilently(GEMINI_URL, { headers: { Authorization: `Bearer ${config?.geminiApiKey}` } });

      if (!geminiModels) {
        updateConfig({ geminiConnected: false });
      } else {
        const parsedModels = geminiModels?.data.map((m: unknown) => ({ ...m, host: 'gemini' })) || [];

        models = [...models, ...parsedModels];
      }
    }
    
    if (config?.groqApiKey) {
      const groqModels = await fetchDataSilently(GROQ_URL, { headers: { Authorization: `Bearer ${config?.groqApiKey}` } });

      if (!groqModels) {
        updateConfig({ groqConnected: false });
      } else {
        const parsedModels = groqModels?.data.map((m: unknown) => ({ ...m, host: 'groq' })) || [];

        models = [...models, ...parsedModels];
      }
    }

    if (config?.openAiApiKey) {
      const openAiModels = await fetchDataSilently(OPENAI_URL, { headers: { Authorization: `Bearer ${config?.openAiApiKey}` } });

      if (!openAiModels) {
        updateConfig({ openAiConnected: false });
      } else {
        const parsedModels = openAiModels?.data.filter((m: unknown) => m.id.startsWith('gpt-')).map((m: unknown) => ({ ...m, host: 'openai' })) || [];

        models = [...models, ...parsedModels];
      }
    }

    const haveModelsChanged = (newModels: unknown[], existingModels: unknown[] = []) => {
      if (newModels.length !== existingModels.length) return true;
      
      const sortById = (a: unknown, b: unknown) => a.id.localeCompare(b.id);
      const sortedNew = [...newModels].sort(sortById);
      const sortedExisting = [...existingModels].sort(sortById);
      
      return JSON.stringify(sortedNew) !== JSON.stringify(sortedExisting);
    };

    if (models.length > 0 && haveModelsChanged(models, config?.models)) {
      const isSelectedAvailable = config?.selectedModel && 
        models.some(m => m.id === config?.selectedModel);

      updateConfig({ 
        models, 
        selectedModel: isSelectedAvailable ? config?.selectedModel : models[0]?.id 
      });
    }
  }, [config, updateConfig, storage.getItem]);

  // Only fetch models when dependencies change
  useEffect(() => {
    fetchModels();
  }, [
    config?.ollamaUrl,
    config?.lmStudioUrl,
    config?.geminiApiKey,
    config?.groqApiKey,
    config?.openAiApiKey,
    fetchModels
  ]);

  return { chatTitle, setChatTitle };
};

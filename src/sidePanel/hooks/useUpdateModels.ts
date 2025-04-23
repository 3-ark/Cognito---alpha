import {
 useCallback,useEffect, useState 
} from 'react';
import storage from 'src/util/storageUtil';
import { useConfig } from '../ConfigContext';
import {
 GEMINI_URL, GROQ_URL, OPENAI_URL, OPENROUTER_URL 
} from '../constants';
import type { Model } from 'src/types/config';

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

    let models: Model[] = [];

    if (config?.ollamaUrl) {
      const ollamaModels = await fetchDataSilently(`${config?.ollamaUrl}/api/tags`);

      if (!ollamaModels) {
        updateConfig({ ollamaConnected: false, ollamaUrl: '' });
      } else {
        const parsedModels = (ollamaModels?.models as Model[] ?? []).map(m => ({
          ...m,
          id: m.id, // fallback if needed
          host: 'ollama'
        }));

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
        const parsedModels = (lmStudioModels?.data as Model[] ?? []).map(m => ({
          ...m,
          id: m.id, // fallback if needed
          host: 'lmStudio'
        }));

        models = [...models, ...parsedModels];
      }
    }

    if (config?.geminiApiKey) {
      const geminiModels = await fetchDataSilently(GEMINI_URL, { headers: { Authorization: `Bearer ${config?.geminiApiKey}` } });

      if (!geminiModels) {
        updateConfig({ geminiConnected: false });
      } else {
        const parsedModels = (geminiModels?.data as Model[] ?? []).filter(m => m.id.startsWith('models/gemini')).map(m => ({
          ...m,
          id: m.id, // fallback if needed
          host: 'gemini'
        }));

        models = [...models, ...parsedModels];
      }
    }
    
    if (config?.groqApiKey) {
      const groqModels = await fetchDataSilently(GROQ_URL, { headers: { Authorization: `Bearer ${config?.groqApiKey}` } });

      if (!groqModels) {
        updateConfig({ groqConnected: false });
      } else {
        const parsedModels = (groqModels?.data as Model[] ?? []).map(m => ({
          ...m,
          id: m.id, // fallback if needed
          host: 'groq'
        }));

        models = [...models, ...parsedModels];
      }
    }

    if (config?.openAiApiKey) {
      const openAiModels = await fetchDataSilently(OPENAI_URL, { headers: { Authorization: `Bearer ${config?.openAiApiKey}` } });

      if (!openAiModels) {
        updateConfig({ openAiConnected: false });
      } else {
        const parsedModels = (openAiModels?.data as Model[] ?? []).filter(m => m.id.startsWith('gpt-')).map(m => ({
          ...m,
          id: m.id, // fallback if needed
          host: 'openai'
        }));

        models = [...models, ...parsedModels];
      }
    }

    if (config?.openRouterApiKey) {
      const openRouterModels = await fetchDataSilently(OPENROUTER_URL, { headers: { Authorization: `Bearer ${config?.openRouterApiKey}` } });

      if (!openRouterModels) {
        updateConfig({ openRouterConnected: false });
      } else {
        const parsedModels = (openRouterModels?.data as Model[] ?? []).map(m => ({
          ...m,
          id: m.id, // fallback if needed
          context_length: m.context_length,
          host: 'openrouter'
        }));

        models = [...models, ...parsedModels];
      }
    }

    // Custom Endpoint
    if (config?.customEndpoint && config?.customApiKey) {
      const customModels = await fetchDataSilently(
        `${config.customEndpoint.replace(/\/v1\/chat\/completions$/, '')}/v1/models`,
        { headers: { Authorization: `Bearer ${config.customApiKey}` } }
      );
      if (customModels?.data) {
        const parsedModels = (customModels.data as Model[] ?? []).map(m => ({
          ...m,
          id: m.id,
          host: 'custom'
        }));
        models = [...models, ...parsedModels];
      }
    }

    const haveModelsChanged = (newModels: Model[], existingModels: Model[] = []) => {
      if (newModels.length !== existingModels.length) return true;

      const sortById = (a: Model, b: Model) => a.id.localeCompare(b.id);
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
    config?.openAiApiKey,      // <-- add this
    config?.openRouterApiKey,         // <-- add this
    config?.customEndpoint,      // <-- add this
    config?.customApiKey,        // <-- add this
    fetchModels
  ]);

  return { chatTitle, setChatTitle };
};

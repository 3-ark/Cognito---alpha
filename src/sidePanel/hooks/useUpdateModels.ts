import { useCallback, useRef } from 'react';
import { useConfig } from '../ConfigContext';
import { GEMINI_URL, GROQ_URL, OPENAI_URL, OPENROUTER_URL } from '../constants';
import type { Config, Model } from 'src/types/config';
import { normalizeApiEndpoint } from 'src/background/util';

// Host Constants
const HOST_OLLAMA = 'ollama';
const HOST_GEMINI = 'gemini';
const HOST_LMSTUDIO = 'lmStudio';
const HOST_GROQ = 'groq';
const HOST_OPENAI = 'openai';
const HOST_OPENROUTER = 'openrouter';
const HOST_CUSTOM = 'custom';

// --- fetchDataSilently remains the same ---
const fetchDataSilently = async (url: string, ModelSettingsPanel = {}) => {
  try {
    const res = await fetch(url, ModelSettingsPanel);
    if (!res.ok) {
      console.error(`[fetchDataSilently] HTTP error! Status: ${res.status} for URL: ${url}`);
      return undefined;
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(`[fetchDataSilently] Fetch or JSON parse error for URL: ${url}`, error);
    return undefined;
  }
};

// --- Service Configuration Interface ---
interface ServiceConfig {
  host: string;
  isEnabled: (config: Config) => boolean;
  getUrl: (config: Config) => string | null;
  getFetchOptions?: (config: Config) => RequestInit | undefined;
  parseFn: (data: any, host: string) => Model[];
  onFetchFail?: (config: Config, updateConfig: (updates: Partial<Config>) => void) => void;
}


export const useUpdateModels = () => {
  // Removed unused chatTitle state
  // const [chatTitle, setChatTitle] = useState('');
  const { config, updateConfig } = useConfig();

  // Helper to update models in config
  const updateModels = useCallback((newModels: Model[], host: string) => {
    console.log(`[updateModels] Called for host: ${host} with ${newModels.length} new models.`); // Add log
    const haveModelsChanged = (newModels: Model[], existingModels: Model[] = []) => {
      if (newModels.length !== existingModels.length) return true;
      const sortById = (a: Model, b: Model) => a.id.localeCompare(b.id);
      const sortedNew = [...newModels].sort(sortById);
      const sortedExisting = [...existingModels].sort(sortById);
      return JSON.stringify(sortedNew) !== JSON.stringify(sortedExisting);
    };

    const existingModels = (config?.models ?? []).filter(m => m.host !== host);
    console.log(`[updateModels] Existing models after filtering host ${host}:`, existingModels.length); // Add log
    const combinedModels = [...existingModels, ...newModels];

    if (haveModelsChanged(combinedModels, config?.models)) {
      console.log(`[updateModels] Models changed for host ${host}. Updating config.`); // Add log
      const isSelectedAvailable = config?.selectedModel &&
        combinedModels.some(m => m.id === config?.selectedModel);

      updateConfig({
        models: combinedModels,
        selectedModel: isSelectedAvailable ? config?.selectedModel : combinedModels[0]?.id
      });
    }
    // Optional: Add else block for logging if needed:
    // else { console.log(`[updateModels] Models for host ${host} did not change. Skipping update.`); }
  }, [config, updateConfig]);

  const FETCH_INTERVAL =  30 * 1000; // 30s
  const lastFetchRef = useRef(0);

  // --- Service Configurations ---
  const serviceConfigs: ServiceConfig[] = [
    {
      host: HOST_OLLAMA,
      isEnabled: (cfg) => !!cfg.ollamaUrl && cfg.ollamaConnected,
      getUrl: (cfg) => `${cfg.ollamaUrl}/api/tags`,
      parseFn: (data, host) => (data?.models as Model[] ?? []).map(m => ({ ...m, id: m.id ?? m.name, host })), // Use name if id missing
      onFetchFail: (_, updateCfg) => updateCfg({ ollamaConnected: false, ollamaUrl: '' }),
      // Refined: Only update connected status on temporary failure
      // onFetchFail: (_, updateCfg) => {
      //   console.log(`[useUpdateModels] Ollama fetch failed, setting ollamaConnected: false`);
      //   updateCfg({ ollamaConnected: false });
      // },
    },
    {
      host: HOST_GEMINI,
      isEnabled: (cfg) => !!cfg.geminiApiKey,
      getUrl: () => GEMINI_URL,
      getFetchOptions: (cfg) => ({ headers: { Authorization: `Bearer ${cfg.geminiApiKey}` } }),
      parseFn: (data, host) => (data?.data as Model[] ?? []).filter(m => m.id.startsWith('models/gemini')).map(m => ({ ...m, id: m.id, host })),
    },
    {
      host: HOST_LMSTUDIO,
      isEnabled: (cfg) => !!cfg.lmStudioUrl && cfg.lmStudioConnected,
      getUrl: (cfg) => `${cfg.lmStudioUrl}/v1/models`,
      parseFn: (data, host) => (data?.data as Model[] ?? []).map(m => ({ ...m, id: m.id, host })),
      // Refined: Only update connected status on temporary failure
      onFetchFail: (_, updateCfg) => {
        console.log(`[useUpdateModels] LM Studio fetch failed, setting lmStudioConnected: false`);
        updateCfg({ lmStudioConnected: false });
      },
    },
    {
      host: HOST_GROQ,
      isEnabled: (cfg) => !!cfg.groqApiKey,
      getUrl: () => GROQ_URL,
      getFetchOptions: (cfg) => ({ headers: { Authorization: `Bearer ${cfg.groqApiKey}` } }),
      parseFn: (data, host) => (data?.data as Model[] ?? []).map(m => ({ ...m, id: m.id, host })),
    },
    {
      host: HOST_OPENAI,
      isEnabled: (cfg) => !!cfg.openAiApiKey,
      getUrl: () => OPENAI_URL,
      getFetchOptions: (cfg) => ({ headers: { Authorization: `Bearer ${cfg.openAiApiKey}` } }),
      parseFn: (data, host) => (data?.data as Model[] ?? []).filter(m => m.id.startsWith('gpt-')).map(m => ({ ...m, id: m.id, host })),
    },
    {
      host: HOST_OPENROUTER,
      isEnabled: (cfg) => !!cfg.openRouterApiKey,
      getUrl: () => OPENROUTER_URL,
      getFetchOptions: (cfg) => ({ headers: { Authorization: `Bearer ${cfg.openRouterApiKey}` } }),
      parseFn: (data, host) => (data?.data as Model[] ?? []).map(m => ({ ...m, id: m.id, context_length: m.context_length, host })),
    },
    {
      host: HOST_CUSTOM,
      isEnabled: (cfg) => !!cfg.customEndpoint, // Only need endpoint URL to try fetching
      getUrl: (cfg) => {
        const normalizedUrl = normalizeApiEndpoint(cfg.customEndpoint);
        return `${normalizedUrl}/v1/models`;
      },
      getFetchOptions: (cfg) => ({ headers: { Authorization: `Bearer ${cfg.customApiKey}` } }),
      parseFn: (data, host) => {
        // Handle both { data: [...] } and [...] structures
        const modelsArray = Array.isArray(data) ? data : data?.data;
        if (modelsArray && Array.isArray(modelsArray)) {
          return (modelsArray as Model[]).map(m => ({ ...m, id: m.id, host }));
        }
        return [];
      },
      // Optional: Add onFetchFail if you want to update a 'customConnected' flag
    },
  ];

  const fetchAllModels = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < FETCH_INTERVAL) {
      console.log('[useUpdateModels] Model fetch throttled');
      return;
    }
    lastFetchRef.current = now;

    if (!config) {
      console.warn('[useUpdateModels] Config not available, skipping fetch.');
      return;
    }

    console.log('[useUpdateModels] Starting model fetch for all configured services...');

    const fetchPromises = serviceConfigs.map(async (service) => {
      if (!service.isEnabled(config)) {
        // Clear models if service is not enabled/configured
        updateModels([], service.host);
        return;
      }

      const url = service.getUrl(config);
      if (!url) {
        console.warn(`[useUpdateModels] Could not determine URL for host: ${service.host}`);
        updateModels([], service.host); // Clear models if URL is invalid
        return;
      }

      const fetchOptions = service.getFetchOptions ? service.getFetchOptions(config) : {};
      const data = await fetchDataSilently(url, fetchOptions);

      if (data) {
        const parsedModels = service.parseFn(data, service.host);
        updateModels(parsedModels, service.host);
      } else {
        // console.log('[useUpdateModels] Failed to fetch from Custom Endpoint. Clearing models.'); // Make log generic or remove
        console.log(`[useUpdateModels] Fetch failed for host: ${service.host}. Clearing models.`);
        updateModels([], service.host); // Clear models on fetch failure
        if (service.onFetchFail) {
          service.onFetchFail(config, updateConfig);
        } // Add logging inside onFetchFail callbacks if further debugging needed
      }
    });

    // Execute all fetches (consider Promise.allSettled for more granular error handling if needed)
    await Promise.all(fetchPromises);

    console.log('[useUpdateModels] Model fetch cycle complete.');

  }, [config, updateModels, updateConfig, FETCH_INTERVAL]); // Removed serviceConfigs from dependencies

  // Removed chatTitle and setChatTitle from return
  return { fetchAllModels };
};

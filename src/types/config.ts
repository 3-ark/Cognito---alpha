export interface Persona {
  Ein: string;
  Jan: string;
  Bruce: string;
  Sherlock: string;
  Agatha: string;
  Charlie: string;
  Warren: string;
}

export interface Model {
  id: string;
  host?: 'groq' | 'ollama' | 'gemini' | 'lmStudio' | 'openai' | 'openrouter' | 'custom' | string;
  active?: boolean;
  context_length?: number;
  name?: string; // Make name optional
  // Add other model-specific properties if needed
}

// Add TTS Settings interface
export interface TtsSettings {
  selectedVoice?: string; // Store the name of the selected voice
  rate?:number;
  pitch?:number;
  volume?:number; // Add other TTS settings like rate, pitch later if needed
}

export interface Config {
  personas: Record<string, string>;
  persona: string;
  generateTitle?: boolean;
  backgroundImage?: boolean;
  webMode?: 'duckduckgo' | 'brave' | 'google' | string;
  webLimit?: number;
  pageMode?: 'text' | 'html';
  contextLimit?: number;
  ModelSettingsPanel?: Record<string, unknown>; // For model parameters like temperature
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  presencePenalty?: number;
  lmStudioUrl?: string;
  lmStudioConnected?: boolean;
  lmStudioError?: string | unknown;
  ollamaUrl?: string;
  ollamaConnected?: boolean;
  ollamaError?: string | unknown;
  groqApiKey?: string;
  groqConnected?: boolean;
  groqError?: string | unknown;
  geminiApiKey?: string;
  geminiConnected?: boolean;
  geminiError?: string | unknown;
  openAiApiKey?: string;
  openAiConnected?: boolean;
  openAiError?: string | unknown;
  openRouterApiKey?: string;
  openRouterConnected?: boolean;
  openRouterError?: string | unknown;
  customEndpoint?: string;
  customApiKey?: string;
  customConnected?: boolean;
  customError?: string | unknown;
  visibleApiKeys?: boolean; // Maybe used somewhere?
  fontSize?: number;
  models?: Model[];
  selectedModel?: string;
  chatMode?: 'web' | 'page' | 'chat' | string;
  theme?: string;
  customTheme?: {
    active?: string;
    bg?: string;
    text?: string;
    bold?: string;
    italic?: string;
    link?: string;
    codeBg?: string;
    codeFg?: string;
    preBg?: string;
    preFg?: string;
    tableBorder?: string;
    error?: string;
    success?: string;
    warning?: string;
    name?: string;
  }; // Add the TTS settings object here
  computeLevel: 'low' | 'medium' | 'high' | string;
  paperTexture?: boolean;
  panelOpen: boolean;
  tts?: TtsSettings; // Add the TTS settings object here
}

export interface ConfigContextType {
  config: Config;
  updateConfig: (newConfig: Partial<Config>) => void;
}
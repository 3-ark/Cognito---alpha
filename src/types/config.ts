export interface Persona {
  Researcher: string;
  Jan: string;
  Bruce: string;
}

export interface Model {
  id: string;
  host?: string; // e.g., 'ollama', 'lmStudio', 'openai', 'gemini', 'groq'
  active?: boolean;
  context_length?: number;
  // Add other model-specific properties if needed
}

export interface Config {
  personas: Record<string, string>;
  persona: string;
  generateTitle?: boolean;
  backgroundImage?: boolean;
  webMode?: 'duckduckgo' | 'brave' | 'google';
  webLimit?: number;
  pageMode?: 'text' | 'html';
  contextLimit?: number;
  params?: Record<string, unknown>; // For model parameters like temperature
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
  chatMode?: 'web' | 'page' | 'chat';
  theme?: string; // Add this line
  customTheme?: {
    active: string;
    bg: string;
    text: string;
  };
  panelOpen: boolean; // Add this property to Config interface
}

export interface ConfigContextType {
  config: Config;
  updateConfig: (newConfig: Partial<Config>) => void;
}
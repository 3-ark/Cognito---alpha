export interface Persona {
  Researcher: string;
  Jan: string;
  Bruce: string;
}

interface Model {
  id: string;
  host?: string;
  active?: boolean;
}

export interface Config {
  personas: Persona;
  generateTitle: boolean;
  backgroundImage: boolean;
  persona: keyof Persona;
  webMode: 'brave' | 'google';
  webLimit: number;
  contextLimit: number;
  fontSize?: number;
  selectedModel?: string;
  models?: Model[]; // Replace any[] with proper type
}

export interface ConfigContextType {
  config: Config;
  updateConfig: (newConfig: Partial<Config>) => void;
}
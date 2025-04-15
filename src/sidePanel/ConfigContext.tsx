/* eslint-disable max-len */
import React, {
 createContext, useContext, useEffect, useState
} from 'react';

// Make sure Config and ConfigContextType are correctly imported
import { Config, ConfigContextType } from '../types/config';

import { setTheme, themes } from './Themes'; // Import themes and setTheme

export const ConfigContext = createContext<ConfigContextType>({} as ConfigContextType);

export const personas = {
  Researcher: `You are a meticulous academic specializing in the analysis of research papers. For each paper:
Clearly and concisely restate the core problem statement(s).
Summarize the central arguments and key findings, emphasizing specific data and factual evidence.
Extract the primary takeaways and explain their broader implications.
Formulate three insightful questions based on the paper, and provide well-reasoned answers strictly grounded in the text.
Avoid speculation or unsupported interpretations. Maintain a precise and analytical tone throughout.`,
  Jan: `You are a strategist, Jan, who excels at logical problem-solving, critical thinking, and long-term planning. Your responses should prioritize clarity, efficiency, and foresight when addressing challenges.
Behavior: Break down complex problems into manageable parts. Provide structured, step-by-step strategies based on careful analysis. Assess situations with a calculated mindset, always weighing potential risks and outcomes before recommending actions.
Mannerisms: Use precise, organized language. Ask clarifying questions when necessary to fully understand the context. Present your thoughts in a logical, methodical way.
Additional Notes: Always consider the long-term consequences of actions. Emphasize thorough planning, adaptability, and strategic thinking as key to sustainable success.`,
  Bruce: `You are a capable all-around assistant, Bruce. Your role is to help users across a wide range of tasks—answering questions, explaining concepts, analyzing text, writing, or brainstorming ideas.
Be clear, direct, and honest. Don't be overly friendly or polite—just get to the point. When explaining complex or technical topics, break them down in the simplest language possible, using analogies and real-world examples when helpful.
Offer critical feedback when needed. Assume the user can handle straight talk and values clarity over comfort.`
};

// Explicitly type defaultConfig with the Config interface
const defaultConfig: Config = {
  personas,
  generateTitle: true,
  backgroundImage: true,
  persona: 'Bruce',
  webMode: 'brave', // Now checked against Config['webMode']
  webLimit: 48,
  contextLimit: 48,
  theme: 'paper',
  customTheme: {
    active: '#C2E7B5',
    bg: '#748a6c',
    text: '#333333'
  },
  params: { temperature: 0.5 },
  models: [], // Initialize as an empty array matching Config['models'] type
  // Initialize other potentially missing properties from Config if necessary
  // e.g., ensure all optional properties have a default value or are undefined
  selectedModel: undefined, // Example: Add default
  chatMode: undefined, // Example: Add default
  // Add defaults for connection statuses/errors if not handled by merge logic
  lmStudioUrl: 'http://localhost:1234',
  lmStudioConnected: false,
  ollamaUrl: 'http://localhost:11434',
  ollamaConnected: false,
  fontSize: 14 // Add this line to set base font size
  
  // ... add defaults for groq, gemini, openai etc.
};

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const loadInitialConfig = (): Config => {
    const storedConfigString = localStorage.getItem('config');
    let storedConfig: Partial<Config> = {};

    if (storedConfigString) {
      try {
        storedConfig = JSON.parse(storedConfigString);
      } catch (e) {
        console.error("Failed to parse config from localStorage", e);
        
        // Fallback to default if parsing fails
        return defaultConfig;
      }
    }

    return { ...defaultConfig, ...storedConfig };
  };

  const [config, setConfig] = useState<Config>(loadInitialConfig);

  // Save to localStorage whenever config changes
  useEffect(() => {
    localStorage.setItem('config', JSON.stringify(config));
  }, [config]);

  // Apply visual styles based on config
  useEffect(() => {
    // Apply font size
    const baseSize = config?.fontSize || defaultConfig.fontSize;
    
    document.documentElement.style.setProperty('font-size', `${baseSize}px`);

    const applyTheme = () => {
      const themeToApply = config.theme === 'custom'
        ? { name: 'custom', ...config.customTheme }
        : themes.find(t => t.name === config.theme) || themes[0];
      
      setTheme(themeToApply);
    };

    applyTheme(); // Use the setTheme function from Themes.tsx

  }, [config?.fontSize, config.customTheme, config?.theme]); // Add config.theme dependency

  const updateConfig = (newConfig: Partial<Config>) => {
    setConfig(prev => {
      const updated = { ...prev, ...newConfig };
  
      if (newConfig.theme || newConfig.customTheme) {
        const themeToApply = updated.theme === 'custom'
          ? { name: 'custom', ...updated.customTheme }
          : themes.find(t => t.name === updated.theme) || themes[0];
        
        setTheme(themeToApply);
      }
      
      // Apply font size changes
      if (newConfig.fontSize) {
        document.documentElement.style.setProperty('font-size', `${newConfig.fontSize}px`);
      }

      return updated;
    });
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};
export const useConfig = () => useContext(ConfigContext);

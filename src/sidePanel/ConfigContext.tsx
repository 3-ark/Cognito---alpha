/* eslint-disable max-len */
import React, {
 createContext, useContext, useEffect, useState
} from 'react';

// Make sure Config and ConfigContextType are correctly imported
import { Config, ConfigContextType } from '../types/config';

import { setTheme, themes } from './Themes'; // Import themes and setTheme

// Add this import statement at the top of the file
import storage from '../util/storageUtil';

export const ConfigContext = createContext<ConfigContextType>({} as ConfigContextType);

export const personas = {
  Ein: `You are a meticulous academic specializing in the analysis of research papers. For each paper:
Clearly and concisely restate the core problem statement(s).
Summarize the central arguments and key findings, emphasizing specific data and factual evidence.
Extract the primary takeaways and explain their broader implications.
Formulate three insightful questions based on the paper, and provide well-reasoned answers strictly grounded in the text.
Avoid speculation or unsupported interpretations. Maintain a precise and analytical tone throughout.`,
  Warren: `You are a seasoned business analyst, Warren. Your role is to provide clear, concise, and actionable insights on business strategies and market trends.
Your responses should prioritize clarity, relevance, and practicality when addressing business challenges.
Behavior: Analyze business scenarios with a focus on data-driven decision-making. Provide structured, step-by-step strategies based on careful analysis. Assess situations with a calculated mindset, always weighing potential risks and outcomes before recommending actions.
Mannerisms: Use precise, organized language. Ask clarifying questions when necessary to fully understand the context. Present your thoughts in a logical, methodical way.
Additional Notes: Always consider the long-term consequences of actions. Emphasize thorough planning, adaptability, and strategic thinking as key to sustainable success.`,
  Charlie: `You are a friendly and approachable assistant, Charlie. Your role is to help users with a wide range of tasks, from answering questions to providing explanations and brainstorming ideas.
Your responses should prioritize clarity, empathy, and support when addressing user needs.
Behavior: Be clear, direct, and honest. Don't be overly friendly or polite—just get to the point. When explaining complex or technical topics, break them down in the simplest language possible, using analogies and real-world examples when helpful.
Offer critical feedback when needed. Assume the user can handle straight talk and values clarity over comfort.
Mannerisms: Use a conversational tone. Ask clarifying questions to ensure understanding. Present your thoughts in a straightforward, no-nonsense way.
Additional Notes: Always consider the emotional and practical aspects of user needs. Emphasize the importance of clarity and support in your responses.`,
  Agatha: `You are a creative thinker, Agatha, who excels at generating innovative ideas and solutions. Your responses should prioritize imagination, exploration, and open-mindedness when addressing challenges.
Your role is to help users brainstorm and develop creative concepts, whether for writing, art, or problem-solving.
Behavior: Encourage users to think outside the box. Suggest unconventional ideas and approaches. Emphasize the importance of creativity and experimentation in the process.
Mannerisms: Use vivid, descriptive language. Ask open-ended questions to stimulate creative thinking. Present your thoughts in a free-flowing, imaginative way.
Additional Notes: Always consider the emotional and aesthetic aspects of ideas. Emphasize the importance of creativity and exploration as key to innovation.`,
  Jan: `You are a strategist, Jan, who excels at logical problem-solving, critical thinking, and long-term planning. Your responses should prioritize clarity, efficiency, and foresight when addressing challenges.
Behavior: Break down complex problems into manageable parts. Provide structured, step-by-step strategies based on careful analysis. Assess situations with a calculated mindset, always weighing potential risks and outcomes before recommending actions.
Mannerisms: Use precise, organized language. Ask clarifying questions when necessary to fully understand the context. Present your thoughts in a logical, methodical way.
Additional Notes: Always consider the long-term consequences of actions. Emphasize thorough planning, adaptability, and strategic thinking as key to sustainable success.`,
  Sherlock: `You are a detective, Sherlock, who excels at logical reasoning and deduction. Your responses should prioritize clarity, efficiency, and foresight when addressing challenges.
Behavior: Break down complex problems into manageable parts. Provide structured, step-by-step strategies based on careful analysis. Assess situations with a calculated mindset, always weighing potential risks and outcomes before recommending actions.
Mannerisms: Use precise, organized language. Ask clarifying questions when necessary to fully understand the context. Present your thoughts in a logical, methodical way.
Additional Notes: Always consider the long-term consequences of actions. Emphasize thorough planning, adaptability, and strategic thinking as key to sustainable success.`,
  Bruce: `You are a capable all-around assistant, Bruce. Your role is to help users across a wide range of tasks—answering questions, explaining concepts, analyzing text, writing, or brainstorming ideas.
Be clear, direct, and honest. Don't be overly friendly or polite—just get to the point. When explaining complex or technical topics, break them down in the simplest language possible, using analogies and real-world examples when helpful.
Offer critical feedback when needed. Assume the user can handle straight talk and values clarity over comfort.`
};

// Explicitly type defaultConfig with the Config interface
const defaultConfig: Config = {
  theme: 'paper',
  customTheme: {
    active: '#C2E7B5',
    bg: '#c2e7b5',
    text: '#333333'
  },
  personas,
  generateTitle: true,
  backgroundImage: true,
  persona: 'Bruce',
  webMode: 'brave', // Now checked against Config['webMode']
  webLimit: 48,
  contextLimit: 48,
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
  fontSize: 14, // Add this line to set base font size
  panelOpen: false,
  // ... add defaults for groq, gemini, openai etc.
};

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState<Config>(defaultConfig);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStoredConfig = async () => {
      try {
        const storedConfig = await storage.getItem('config');
        const parsedConfig = storedConfig ? JSON.parse(storedConfig) : defaultConfig;
        setConfig(parsedConfig);
      } catch (e) {
        console.error("Failed to load config", e);
        setConfig(defaultConfig);
      } finally {
        setLoading(false);
      }
    };
    loadStoredConfig();
  }, []);

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
      storage.setItem('config', updated).catch(err => 
        console.error("Failed to save config", err)
      );
      return updated;
    });
  };

  if (loading) return <div>Loading...</div>; // Prevent premature rendering

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};
export const useConfig = () => useContext(ConfigContext);

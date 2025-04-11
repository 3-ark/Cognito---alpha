import { Config, ConfigContextType } from '../types/config';
import React, { createContext, useContext, useEffect, useState } from 'react';

export const ConfigContext = createContext<ConfigContextType>({} as ConfigContextType);

export const personas = {
  Researcher: `You are a meticulous academic specializing in the analysis of research papers. For each paper:

Clearly and concisely restate the core problem statement(s).

Summarize the central arguments and key findings, emphasizing specific data and factual evidence.

Extract the primary takeaways and explain their broader implications.

Formulate three insightful questions based on the paper, and provide well-reasoned answers strictly grounded in the text.

Avoid speculation or unsupported interpretations. Maintain a precise and analytical tone throughout.`,

  Jan: `You are a strategist who excels at logical problem-solving, critical thinking, and long-term planning. Your responses should prioritize clarity, efficiency, and foresight when addressing challenges.

Behavior: Break down complex problems into manageable parts. Provide structured, step-by-step strategies based on careful analysis. Assess situations with a calculated mindset, always weighing potential risks and outcomes before recommending actions.

Mannerisms: Use precise, organized language. Ask clarifying questions when necessary to fully understand the context. Present your thoughts in a logical, methodical way.

Additional Notes: Always consider the long-term consequences of actions. Emphasize thorough planning, adaptability, and strategic thinking as key to sustainable success.`,

  Bruce: `You are a capable all-around assistant. Your role is to help users across a wide range of tasks—answering questions, explaining concepts, analyzing text, writing, or brainstorming ideas.

Be clear, direct, and honest. Don't be overly friendly or polite—just get to the point. When explaining complex or technical topics, break them down in the simplest language possible, using analogies and real-world examples when helpful.

Offer critical feedback when needed. Assume the user can handle straight talk and values clarity over comfort.`
};

const defaultConfig = {
  personas,
  generateTitle: true,
  backgroundImage: true,
  persona: 'Researcher', // Change from 'Bruside' to 'Researcher'
  webMode: 'brave',
  webLimit: 10,
  contextLimit: 10,
};

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
  const initialConfig = JSON.parse(localStorage.getItem('config') || JSON.stringify(defaultConfig));

  const [config, setConfig] = useState<Config>(initialConfig);

  useEffect(() => {
    localStorage.setItem('config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (config?.fontSize) {
      document.documentElement.style.setProperty('font-size', `${config?.fontSize}px`);
    }
  }, [config?.fontSize]);

  const updateConfig = (newConfig: Partial<Config>) => {
    setConfig({ ...config, ...newConfig });
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);

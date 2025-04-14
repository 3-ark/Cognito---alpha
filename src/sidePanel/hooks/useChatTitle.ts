import { useEffect, useState } from 'react';

import { useConfig } from '../ConfigContext';
import { fetchDataAsStream } from '../network';

const generateTitle = 'Create a concise title (2-4 words) for our conversation. Only respond with the title, no extra text. Example: "Trade War Escalates"';

export const useChatTitle = (isLoading: boolean, messages: string[], message: string) => {
  const [chatTitle, setChatTitle] = useState('');
  const { config } = useConfig();

  useEffect(() => {
    if (!isLoading && messages.length >= 2 && !chatTitle && config?.generateTitle) {
      const currentModel = config?.models?.find((model) => model.id === config.selectedModel);
      
      if (!currentModel) return;

      const messagesForTitle = [
        ...messages.slice(0, 2).map((m, i) => ({
          content: m || generateTitle,
          role: i % 2 === 0 ? 'user' : 'assistant'
        })),
        { role: 'user', content: generateTitle }
      ];

      const getApiConfig = () => {
        switch (currentModel.host) {
          case 'groq':
            return {
              url: 'https://api.groq.com/openai/v1/chat/completions',
              headers: { Authorization: `Bearer ${config.groqApiKey}` },
              body: {
                 model: currentModel.id, messages: messagesForTitle, stream: true 
                }
            };

          case 'ollama':
            return {
              url: `${config.ollamaUrl}/api/chat`,
              headers: {},
              body: {
                 model: currentModel.id, messages: messagesForTitle, stream: true 
                }
            };

          case 'lmStudio':
            return {
              url: `${config.lmStudioUrl}/v1/chat/completions`,
              headers: {},
              body: {
                 model: currentModel.id, messages: messagesForTitle, stream: true 
                }
            };

          case 'gemini':
            return {
              url: `https://generativelanguage.googleapis.com/v1beta/models/${currentModel.id}:generateContent`,
              headers: { 'Content-Type': 'application/json' },
              body: { contents: messagesForTitle }
            };

          case 'openai':
            return {
              url: 'https://api.openai.com/v1/chat/completions',
              headers: { Authorization: `Bearer ${config.openAiApiKey}` },
              body: {
                 model: currentModel.id, messages: messagesForTitle, stream: true 
                }
            };

          default:
            return null;
        }
      };

      const apiConfig = getApiConfig();
      
      if (!apiConfig) return;

      fetchDataAsStream(
        apiConfig.url,
        apiConfig.body,
        (part: string) => {
          const cleanTitle = part
            .replace(/"/g, '')
            .replace(/#/g, '')
            .trim();

          if (cleanTitle) setChatTitle(cleanTitle);
        },
        apiConfig.headers,
        currentModel.host
      );
    }
  }, [isLoading, messages, message, config]);

  return { chatTitle, setChatTitle };
};
import { useEffect, useState } from 'react';

import { useConfig } from '../ConfigContext';
import { fetchDataAsStream } from '../network';

const generateTitle = 'Create a short 2-4 word title for this chat. Only respond with the title. Example: "Trade War Analysis"';

export const useChatTitle = (isLoading: boolean, messages: string[], message: string) => {
  const [chatTitle, setChatTitle] = useState('');
  const { config } = useConfig();

  useEffect(() => {
    if (!isLoading && messages.length >= 2 && !chatTitle && config?.generateTitle) {
      const currentModel = config?.models?.find((model) => model.id === config.selectedModel);
      
      if (!currentModel) return;

      // Prepare messages for title generation (first 2 messages + instruction)
      const messagesForTitle = [
        ...messages.slice(0, 2).map((m, i) => ({
          content: m || generateTitle,
          role: i % 2 === 0 ? 'user' : 'assistant'
        })),
        { role: 'user', content: generateTitle }
      ];

      // Define API endpoints for each provider (OpenAI-compatible)
      const getApiConfig = () => {
        const baseConfig = {
          body: { 
            model: currentModel.id, 
            messages: messagesForTitle, 
            stream: true 
          },
          headers: {} as Record<string, string>
        };

        switch (currentModel.host) {
          case 'groq':
            return {
              ...baseConfig,
              url: 'https://api.groq.com/openai/v1/chat/completions',
              headers: { Authorization: `Bearer ${config.groqApiKey}` }
            };

          case 'ollama':
            return {
              ...baseConfig,
              url: `${config.ollamaUrl}/api/chat`
            };

          case 'lmStudio':
            return {
              ...baseConfig,
              url: `${config.lmStudioUrl}/v1/chat/completions`
            };

          case 'gemini':
            return {
              ...baseConfig,
              url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', // OpenAI-compatible endpoint
              headers: { Authorization: `Bearer ${config.geminiApiKey}` }
            };

          case 'openai':
            return {
              ...baseConfig,
              url: 'https://api.openai.com/v1/chat/completions',
              headers: { Authorization: `Bearer ${config.openAiApiKey}` }
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
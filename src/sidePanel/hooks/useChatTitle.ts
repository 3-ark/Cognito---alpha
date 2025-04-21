import { useEffect, useState } from 'react';

import { useConfig } from '../ConfigContext';
import { fetchDataAsStream } from '../network';
import { MessageTurn } from '../ChatHistory';

interface ApiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const generateTitle = 'Create a short 2-4 word title for this chat. Only respond with the title. Example: "Trade War Analysis"';

export const useChatTitle = (isLoading: boolean, turns: MessageTurn[], message: string) => {
  const [chatTitle, setChatTitle] = useState('');
  const [titleGenerated, setTitleGenerated] = useState(false);
  const { config } = useConfig();

  useEffect(() => {
    // Only run if:
    // 1. Not already loading
    // 2. Have enough messages
    // 3. No title yet
    // 4. Title generation is enabled
    // 5. Title hasn't been generated yet for this chat
    if (!isLoading && 
        turns.length >= 2 && 
        !chatTitle && 
        config?.generateTitle && 
        !titleGenerated) {

      const currentModel = config?.models?.find((model) => model.id === config.selectedModel);
      if (!currentModel) return;

      // Prepare messages for title generation (first 2 messages + instruction)
      const messagesForTitle: ApiMessage[] = [ // Explicitly type as ApiMessage[]
        ...turns.slice(0, 2).map((turn): ApiMessage => ({ // Map over the first two turns
          content: turn.rawContent || '', // Use rawContent from the turn
          role: turn.role // Use the actual role from the turn
        })),
        { role: 'user', content: generateTitle } // Add the specific instruction
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
            console.warn(`useChatTitle: Unsupported host for title generation: ${currentModel.host}`);
            return null;
        }
      };

      const apiConfig = getApiConfig();
      
      if (!apiConfig) return;

      let accumulatedTitle = '';
      fetchDataAsStream(
        apiConfig.url,
        apiConfig.body,
        (part: string, isFinished?: boolean) => {
          accumulatedTitle = part; // Update with the latest part
          if (isFinished) { // Only set the title once the stream is finished
              const cleanTitle = accumulatedTitle
                  .replace(/"/g, '')
                  .replace(/#/g, '')
                  .trim();
              if (cleanTitle) {
                  console.log("Setting chat title:", cleanTitle);
                  setChatTitle(cleanTitle);
                  setTitleGenerated(true); // Mark as generated
              }
          }
        },
        apiConfig.headers,
        currentModel.host
      );
    }
  }, [isLoading, turns, message, config, chatTitle, titleGenerated]); // Add titleGenerated to deps

  return { chatTitle, setChatTitle };
};
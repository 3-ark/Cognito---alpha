import { useEffect, useState } from 'react';

import { normalizeApiEndpoint } from 'src/background/util';
import { useConfig } from '../ConfigContext';
import { fetchDataAsStream } from '../network';
import { MessageTurn } from '../ChatHistory';

interface ApiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Add helper function to extract title from COT response
const extractTitle = (response: string): string => {
  // First remove any thinking blocks
  const titleOnly = response
    .replace(/<think>[\s\S]*?<\/think>/g, '') // Use [\s\S] to match any char including newlines
    .replace(/"/g, '')
    .replace(/#/g, '')
    .trim();
    
  // If we have content after removing thinking blocks, use it
  return titleOnly || "New Chat";
};

export const useChatTitle = (isLoading: boolean, turns: MessageTurn[], message: string) => {
  const [chatTitle, setChatTitle] = useState('');
  const { config } = useConfig();

  useEffect(() => {
    // Simplified conditions:
    // 1. Not already loading
    // 2. Have enough messages to generate a meaningful title
    // 3. No title yet
    // 4. Title generation is enabled in config
    if (!isLoading && 
        turns.length >= 2 && 
        !chatTitle && 
        config?.generateTitle) {

      const currentModel = config?.models?.find((model) => model.id === config.selectedModel);
      if (!currentModel) return;

      // Prepare messages for title generation (first 2 messages + instruction)
      const messagesForTitle: ApiMessage[] = [ // Explicitly type as ApiMessage[]
        ...turns.slice(0, 2).map((turn): ApiMessage => ({ // Map over the first two turns
          content: turn.rawContent || '', // Use rawContent from the turn
          role: turn.role // Use the actual role from the turn
        })),
        { 
          role: 'user', 
          content: 'Create a short 2-4 word title for this chat. Keep it concise, just give me the best one, just one. No explanations or thinking steps needed.' 
        }
      ];

      // Define API endpoints for each provider (OpenAI-compatible)
      const getApiConfig = () => {
        const baseConfig = {
          body: { 
            model: currentModel.id, 
            messages: messagesForTitle,
            // Set stream false for local models
            stream: !['ollama', 'lmStudio'].includes(currentModel.host || '')
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
          
          case 'openrouter':
            return {
              ...baseConfig,
              url: 'https://openrouter.ai/api/v1/chat/completions',
              headers: { Authorization: `Bearer ${config.openRouterApiKey}` }
            };

          case 'custom':
            const normalizedUrl = normalizeApiEndpoint(config?.customEndpoint);

            if (!normalizedUrl) {
              console.error("Custom endpoint is invalid or empty.");
              throw new Error("Invalid custom endpoint"); 
           }
   
           return {
             ...baseConfig,
             url: `${normalizedUrl}/v1/chat/completions`, // Use the normalized URL
             headers: { Authorization: `Bearer ${config.customApiKey}` }
           };
          }
      };

      const apiConfig = getApiConfig();
      
      if (!apiConfig) return;

      if (['ollama', 'lmStudio'].includes(currentModel.host || '')) {
        // Handle local models with regular fetch
        fetch(apiConfig.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...apiConfig.headers
          },
          body: JSON.stringify(apiConfig.body)
        })
        .then(res => res.json())
        .then(data => {
          const rawTitle = data.choices?.[0]?.message?.content || '';
          const cleanTitle = extractTitle(rawTitle);
          if (cleanTitle) {
            console.log("Setting chat title (local):", cleanTitle);
            setChatTitle(cleanTitle);
          }
        })
        .catch(err => console.error('Title generation failed:', err));
      } else {
        // Handle streaming API models
        let accumulatedTitle = '';
        fetchDataAsStream(
          apiConfig.url,
          apiConfig.body,
          (part: string, isFinished?: boolean) => {
            accumulatedTitle = part;
            if (isFinished) {
              const cleanTitle = extractTitle(accumulatedTitle);
              if (cleanTitle) {
                console.log("Setting chat title (streaming):", cleanTitle);
                setChatTitle(cleanTitle);
              }
            }
          },
          apiConfig.headers,
          currentModel.host || ''
        );
      }
    }
  }, [isLoading, turns, message, config, chatTitle]);

  return { chatTitle, setChatTitle };
};
import { useEffect, useState } from 'react';

import { useConfig } from '../ConfigContext';
import { fetchDataAsStream } from '../network';

const generateTitle = 'create a short title to our conversation. only answer with the title string, say nothing else but the chat title. use spaces between the words. Here is an example title: New summarizer assignment';

export const useChatTitle = (isLoading, messages, message) => {
  const [chatTitle, setChatTitle] = useState('');
  const { config } = useConfig();
  const configBody = { stream: true };

  useEffect(() => {
    if (!isLoading && messages.length >= 2 && !chatTitle && config?.generateTitle) {
      const currentMessages = [message, ...messages].map((m, i) => ({
        content: m || generateTitle,
        role: i % 2 === 1 ? 'assistant' : 'user'
      })).reverse();

      const currentModel = config?.models?.find(({ id }: string) => id === config?.selectedModel);
      const url = {
        groq: 'https://api.groq.com/openai/v1/chat/completions',
        ollama: `${config?.ollamaUrl}/api/chat`,
        gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        openai: 'https://api.openai.com/v1/chat/completions'
      }[currentModel?.host || ''];

      fetchDataAsStream(
        url,
        {
          ...configBody,
          model: config?.selectedModel,
          messages: [
            ...currentMessages
          ]
        },
        (part: string) => {
          if (part) setChatTitle(part.replace('"', '').replace('"', '').replace('# ', '').trim());
        },
        { Authorization: `Bearer ${config?.geminiApiKey}` },
        currentModel?.host
      );
    }
  }, [isLoading]);

  return { chatTitle, setChatTitle };
};

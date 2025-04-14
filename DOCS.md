# Bruside

## connections 

### ollama

- [install ollama](https://ollama.com/download)
- or install it with `curl -fsSL https://ollama.com/install.sh | sh`

```
# select a model from https://ollama.com/library
ollama pull phi3

# start the daemon
ollama serve
```

### LM Studio

- [install LM Studio](https://lmstudio.ai/)
- download a model from the home screen, or use the search tab to pull from Huggingface
- go to `Local server` tab, hit `Start server`, and select your downloaded model

### groq

Groq offers a wide variety of models with a generous free tier.
- [Website](https://groq.com/)
- [Create an API key](https://console.groq.com/keys)

### Google

### OpenAI

### Maybe More (But it's a little overwhelming even now...

## persona

Create and modify your own personal assistants!

Check out these collections for inspiration:
- [0xeb/TheBigPromptLibrary](https://github.com/0xeb/TheBigPromptLibrary)
- [sockcymbal/persona_library](https://github.com/sockcymbal/enhanced-llm-reasoning-tree-of-thoughts/blob/main/persona_library.md)
- [abilzerian/LLM-Prompt-Library](https://github.com/abilzerian/LLM-Prompt-Library)
- [kaushikb11/awesome-llm-agents](https://github.com/kaushikb11/awesome-llm-agents)

## page context

Augment your conversation with the content of your (currently visited) web page.

- select `text mode` to share the text content of your page
- select `html mode` to share the source code of the site (resource-intensive, 
only for development purposes) 
- adjust `char limit` to control the context number in your conversation. Decrease this if you have a limited context window.

## web search

Basic web augmentation for your chats. Enter your web search query, and Bruside will load up an async web search to answer your questions based on live public data.

- you can choose `duckduckgo`, `brave`, `google` as your web source
- adjust `char limit` to control the context number in your conversation. decrease this if you have a limited context window.
- Note: Sometimes you should visit yourself for the first search to gain access.

## File Structure

Key project structure with implementation details:

```
Bruside/
├── config/                # Build configuration and manifest definitions
│   ├── manifest/          # Browser extension manifests per platform
│   └── webpack.config.js  # Bundle configuration for Chrome extension
├── src/
│   ├── background/        # Extension background service worker
│   ├── content/           # Content scripts injected into pages
│   ├── sidePanel/         # Chat interface UI components
│   ├── state/             # Application state management
│   └── util/              # Shared utilities and helpers
├── public/                # Static assets served with extension
│   └── images/            # Application icons and UI graphics
├── docs/                  # Documentation assets and user guides
└── package.json           # Project dependencies and build scripts
```

Development instructions:
- `src/`: Main extension source code
  - Modify `sidePanel/` for UI changes
  - Update `content/` scripts for page interaction logic
  - Adjust `background/` for extension lifecycle management
- `config/webpack.config.js`: Modify build outputs and entry points
- `config/manifest/`: Update extension permissions and metadata

Build with:
```sh
npm start      # Development watch mode
```

## Advanced Tweaks


### useChatTitle.ts
Here’s the **simplified, OpenAI-compatible** `useChatTitle` hook you’re using, with easy extensibility for future models:  

```typescript
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
```

---

### **How to Add New Models Later**
1. **Extend `getApiConfig()`**  
   Just add a new `case` for your model (e.g., `anthropic`, `mistral`, etc.):  
   ```typescript
   case 'new-model':
     return {
       ...baseConfig,
       url: 'NEW_MODEL_API_URL',
       headers: { Authorization: `Bearer ${config.newModelApiKey}` },
     };
   ```

2. **Ensure OpenAI-Compatible API**  
   The new model must support:  
   - Same request format (`{ model, messages, stream }`).  
   - Same streaming response format (text chunks).  

3. **Update `ConfigContext`**  
   Add the new API key to your `defaultConfig` in `ConfigContext.tsx`:  
   ```typescript
   newModelApiKey: '',  // Add this
   ```

---

### **Why This Works So Well**
- **Consistency**: All models use the same logic.  
- **Minimal Changes**: Adding new models takes seconds.  
- **No Fragility**: No provider-specific parsing.  

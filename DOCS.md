# Bruside

## connections 

**ollama**

- [install ollama](https://ollama.com/download)
- or install it with `curl -fsSL https://ollama.com/install.sh | sh`

```
# select a model from https://ollama.com/library
ollama pull phi3

# start the daemon
ollama serve
```

**LM Studio**

- [install LM Studio](https://lmstudio.ai/)
- download a model from the home screen, or use the search tab to pull from Huggingface
- go to `Local server` tab, hit `Start server`, and select your downloaded model

**groq**

Groq offers a wide variety of models with a generous free tier.
- [Website](https://groq.com/)
- [Create an API key](https://console.groq.com/keys)

**Google**

**OpenAI**

**More**

## persona

Create and modify your own personal assistants!

Check out these collections for inspiration:
- [0xeb/TheBigPromptLibrary](https://github.com/0xeb/TheBigPromptLibrary)
- [sockcymbal/persona_library](https://github.com/sockcymbal/enhanced-llm-reasoning-tree-of-thoughts/blob/main/persona_library.md)
- [abilzerian/LLM-Prompt-Library](https://github.com/abilzerian/LLM-Prompt-Library)
- [kaushikb11/awesome-llm-agents](https://github.com/kaushikb11/awesome-llm-agents)

## page context

Augment your conversation with the content of your (currently visited) web page.

The chat history includes **all previous messages** in the conversation by default, but context limits apply for AI processing:

1. **Full History Storage** in Bruside.tsx:
```tsx
const [messages, setMessages] = useState<ChatMessage[]>([]); // Stores all messages
```

2. **Context Limits** in useSendMessage.ts:
```ts
// Page content limited by contextLimit (default 1000 chars)
const charLimit = 1000 * (config?.contextLimit || 1);
const limitedContent = currentPageContent.substring(0, charLimit);

// Web results limited by webLimit (default 1000 chars)
const webLimit = 1000 * (config?.webLimit || 1);
const limitedWebResult = searchRes.substring(0, webLimit);
```

3. **Message Processing** in useSendMessage.ts:
```ts
const currentMessages: ApiMessage[] = [message, ...messages] // All messages included
  .map((m: string, i: number) => ({ content: m, role: i % 2 === 1 ? 'assistant' : 'user' }))
  .reverse();
// Previous messages are included in each API request
```

4. System Prompt Construction (also in useSendMessage.ts):
```ts
const systemContent = `
  ${persona}
  ${pageContentForLlm ? `. Use page context: ${pageContentForLlm}` : ''}
  ${webContentForLlm ? `. Web results: ${webContentForLlm}` : ''}
`;
// Combines persona instructions with contextual information
```

There's no hard-coded message count limit - the conversation history grows until:
- User resets the chat
- Browser storage limits are reached (via localforage)
- Context window limits of the AI model being used

You can configure content limits in Settings via `contextLimit` and `webLimit` multipliers.

- select `text mode` to share the text content of your page
- select `html mode` to share the source code of the site (resource-intensive, 
only for development purposes) 
- adjust `char limit` to control the context number in your conversation. Decrease this if you have a limited context window.

## web search

Basic web augmentation for your chats. Enter your web search query, and Bruside will load up an async web search to answer your questions based on live public data.

Context awareness
```ts
export const processQueryWithAI = async (
  query: string,
  config: Config,
  currentModel: Model,
  authHeader?: Record<string, string>,
  contextMessages: string[] = []
```
- you can choose `duckduckgo`, `brave`, `google` as your web source
- adjust `char limit` to control the context number in your conversation. decrease this if you have a limited context window.
- Note: Sometimes you should visit yourself for the first search to gain access.

A system prompt with chat history to make it understand the context.
```ts
 // System prompt to optimize queries
  const systemPrompt = `You are a Google search query optimizer. Your task is to rewrite user's input [The user's raw input && chat history:${contextMessages.join('\n')}].
\n\n
Instructions:
**Important** No Explanation, just the optimized query!
\n\n
1. Extract the key keywords and named entities from the user's input.
2. Correct any obvious spelling errors.
3. Remove unnecessary words (stop words) unless they are essential for the query's meaning.
4. If the input is nonsensical or not a query, return the original input.
5. Using previous chat history to understand the user's intent.
\n\n
Output:
'The optimized Google search query'
\n\n
Example 1:
Input from user ({{user}}): where can i find cheep flights to london
Output:
'cheap flights London'
\n\n
Example 2:
Context: {{user}}:today is a nice day in paris i want to have a walk and find a restaurant to have a nice meal. {{assistant}}: Bonjour, it's a nice day!
Input from user ({{user}}): please choose me the best resturant 
Output:
'best restaurants Paris France'
\n\n
Example 3:
Input from user ({{user}}): asdf;lkjasdf
Output:
'asdf;lkjasdf'
`;
```

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

### UI Customization Guide for Bruside Extension

This explains how to customize various UI elements in the Bruside Chrome extension, which uses Chakra UI as its primary component library.

#### Theme System Overview

The extension uses a dual theming system:
- **CSS Variables** (for global styles)
- **Chakra UI Theme** (for component styles)

Key CSS variables:
```css
:root {
  --bg: #F5E9D5;        /* Background color */
  --active: #dcc299;    /* Active/highlight color */
  --text: #5B4636;      /* Primary text color */
  --bold: #af1b1b;      /* Strong text color */
  --italic: #09993e;    /* Emphasized text color */
  --link: #003bb9;      /* Link color */
}
```

#### Customizing Colors

##### 1. Preset Themes
Located in `Themes.tsx`:
```tsx
export const themes = [
  {
    name: 'paper', 
    active: '#dcc299', 
    bg: '#F5E9D5', 
    text: '#5B4636'
  },
  // ...other themes
];
```

##### 2. Custom Theme
Custom colors can be set through the UI and are stored in:
```tsx
customTheme: {
  active: '#C2E7B5',
  bg: '#c2e7b5',
  text: '#333333'
}
```

#### Component Styling

##### 1. Buttons
Example from `Header.tsx`:
```tsx
<Button
  _hover={{ 
    background: 'var(--active)', 
    border: '2px solid var(--text)' 
  }}
  background="var(--active)"
  border="2px solid var(--text)"
  borderRadius={16}
  color="var(--text)"
>
  Click me
</Button>
```

##### 2. Select Boxes
Styled in `Header.tsx` with special options styling:
```tsx
<Select
  sx={{
    '> option': {
      background: 'var(--bg)',
      color: 'var(--text)',
      '--option-bg-contrast': 'color-mix(in srgb, var(--text) 20%, var(--bg))'
    },
  }}
  _hover={{
    borderColor: 'var(--text)', 
    background: 'var(--active)' 
  }}
  background="transparent"
  border="2px solid var(--text)"
>
  {/* options */}
</Select>
```

##### 3. Input Fields
Example from `Input.tsx`:
```tsx
<Input
  border="2px solid var(--text)"
  _focus={{
    borderColor: 'var(--text)',
    boxShadow: 'none'
  }}
/>
```

#### Typography

##### 1. Font Family
Set in `index.html`:
```html
<style>
:root {
  font-family: 'Poppins', sans-serif;
}
</style>
```

##### 2. Text Components
Custom Markdown components in `Message.tsx`:
```tsx
const P = ({ children }: ParagraphProps) => (
  <p style={{
    paddingTop: 0,
    paddingBottom: '0.2rem',
    wordBreak: 'break-word'
  }}>{children}</p>
);
```

#### Special Elements

##### 1. Paper Texture
Applied via pseudo-elements:
```tsx
sx={{
  '&::before': {
    content: '""',
    backgroundImage: 'url(assets/images/paper-texture.png)',
    opacity: 0.3,
    mixBlendMode: 'multiply'
  }
}}
```

##### 2. Message Bubbles
Styled in `Message.tsx` with:
- Background alternation
- Texture overlay
- Border styling

#### Troubleshooting

##### Common Issues

1. **Styles not applying**:
   - Check if the component uses `sx` vs `style` prop
   - Verify CSS variable names match

2. **Select options not styled**:
   - Ensure the `sx` prop targets `> option` specifically

3. **Hover states not working**:
   - Use Chakra's `_hover` prop instead of CSS `:hover`

##### Development Tips

1. Use Chrome DevTools to inspect:
   - Computed styles
   - CSS variable values
   - Pseudo-elements

2. For Chakra-specific components:
   - Right-click → "Store as global variable"
   - Inspect `$0.__chakraProps` in console

3. Check the Chakra UI docs for:
   - Component-specific props
   - Style configuration options

#### Advanced Customization

To modify the Chakra theme globally, edit `index.tsx`:
```tsx
const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false
  },
  // Add other theme overrides here
});
```

For further tweaks:
[Comprehensive UI Customization Guide for Bruside Extension.md](https://github.com/3-ark/Bruside/blob/main/Comprehensive%20UI%20Customization%20Guide%20for%20Bruside%20Extension.md)
Remember that most visual styling should be done through the theme system and CSS variables rather than direct component overrides for maintainability.

### Others

#### useChatTitle.ts
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

#### **How to Add New Models Later**
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
# Bruside

## connections 

![](/docs/connections.png)

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
- download a model from the home screen, or use the search tab to pull from huggingface
- go to `Local server` tab, hit `Start server`, and select your downloaded model

### groq

Groq offers a wide variety of models with a generous free tier.
- [Website](https://groq.com/)
- [Create an API key](https://console.groq.com/keys)

### Google

### OpenAI

### Maybe More (But it's a little overwhelming even now...

## persona

![](/docs/persona.png)

Create and modify your own personal assistants!

Check out these collections for inspiration:
- [0xeb/TheBigPromptLibrary](https://github.com/0xeb/TheBigPromptLibrary)
- [sockcymbal/persona_library](https://github.com/sockcymbal/enhanced-llm-reasoning-tree-of-thoughts/blob/main/persona_library.md)
- [abilzerian/LLM-Prompt-Library](https://github.com/abilzerian/LLM-Prompt-Library)
- [kaushikb11/awesome-llm-agents](https://github.com/kaushikb11/awesome-llm-agents)

## page context

![](/docs/pageContext.png)

Augment your conversation with the content of your (currently visited) web page.

- select `text mode` to share the text content of your page
- select `html mode` to share the source code of the site (resource intensive, 
only for development purposes) 
- adjust `char limit` to control the maximum amount of characters you want to share in your conversation. decrease this amount if you have limited context window.

## web search

![](/docs/webSearch.png)

Basic web-augmentation for your chats. Enter your web search query, and Bruside will load up an async web search to answer your questions based on live public data.

- you can choose `duckduckgo` or `brave` as your web source
- adjust `char limit` to control the maximum amount of characters you want to share in your conversation. decrease this amount if you have limited context window.

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


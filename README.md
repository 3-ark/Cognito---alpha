![](/public/images/Bruside.png)

# Bruside

All-around tiny browser-augmented chat client for open-source language models.

## Plan

- [X] Add https://www.google.com/search?q= as searching engine
- [ ] Inject code from chat <br>

~- [ ] Migrate React to 19~ <br>

~- [ ] Migrate webext-redux to 4~ <br>

~- [ ] Migrate Chakra-ui to 3~ <br>

~- [ ] toolkit to 2 webpack-plugin 13 framer-motion to 12~ <br>

- [X] Picture
- [X] Better web search
- [X] Better web parsing
- [ ] Refine the Web Search, no query shows in the first search message, even with a connection. The prompt should include the messages as contexts.
Notes: 
1. Chakra-UI 3 doesn't support Chakra icons, so I need to migrate to react-icons instead. It looks better and gives you more choices. But it's quite a lot of work, and it's currently hard for Vibecoding, because you need to provide docs and check line by line. But this is still easy to start because you don't need to upgrade Chakra-UI to finish this; it can be done in the current setup.
2. The document is unclear in many places and is still new, so it's not a bad idea to stick to the current version. 
3. Only fix bugs, it's too hard for me.

## installation

- download the latest [release](https://github.com/3-ark/Bruside/releases)
- enable Chrome `Extensions > Developer mode`
- load the content of the extracted zip with `Load unpacked` button

### install from source

- clone the repo
- run `npm i && npm start` to generate your bundle located in `dist/chrome`
- enable chrome `Extensions > Developer mode`
- load the content of `dist/chrome` folder with `Load unpacked` button

## docs

Check out the [documentation page](/DOCS.md)

### Available Personas

Bruside comes with three distinct personas to suit different needs:

1. **Bruside** - Academic paper analysis specialist
   - Analyzes research papers with precision
   - Provides structured breakdowns of arguments and findings
   - Generates insightful questions based on the content

2. **Jan** - Strategic problem-solving expert
   - Excels at logical analysis and long-term planning
   - Breaks down complex problems systematically
   - Provides structured, step-by-step solutions

3. **Bruce** - All-purpose assistant
   - Direct and efficient communication style
   - Explains complex topics with simple language
   - Provides straightforward feedback and solutions

![](/docs/Bruside_app.png)

Web Search
![alt text](/docs/websearch.png)

</a>

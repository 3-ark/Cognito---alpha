![](/public/images/Cognito.png)

# Cognito

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
- [X] Refine the Web Search, no query shows in the first search message, even with a connection. The prompt should include the messages as contexts.
- [ ] Fix bugs (~searching title display~, border gets too wide sometimes, web search UI crash with developer tools)
- [X] Better parsing for Brave and DuckDuckGo
- [ ] Add some extra buttons for page mode
- [ ] Rewrite the API connection in openai compatible endpoint that allows custom API to be added freely
- [ ] Comparison mode


Notes: 
1. Chakra-UI 3 doesn't support Chakra icons, so I need to migrate to react-icons instead. It looks better and gives you more choices. But it's quite a lot of work, and it's currently hard for Vibecoding, because you need to provide docs and check line by line. But this is still easy to start because you don't need to upgrade Chakra-UI to finish this; it can be done in the current setup. The document is unclear in many places and is still new, so it's not a bad idea to stick to the current version. 
2. I will mainly fix bugs. At least for now, adding new functions is too hard for me. Comparison mode, I will try, but...let's see. Now I am trying to migrate to a strict CSP to prevent potential XSS. And after a little research, it's just too much work to do, because of the UI again. Anyway. Forget it.
3. The markdown this project is using is react-markdown & redux-GFM. React‑Markdown uses **remark‑parse**, which follows the CommonMark rules strictly: The content of a code fence is treated as literal text, not parsed as inlines.  The first word of the info string is typically used to specify the language…:contentReference[oaicite:1]{index=1}. So, because the fences collide for nested code blocks, remark‑parse never sees inner lines as *inside* a code fence. I tried CSS, and it conflicts with my current style. Meanwhile, I have not seen it perfectly rendered either; besides, nested code is not very common to see. So I just leave it there. You are welcome to solve it!


## installation

- download the latest [release](https://github.com/3-ark/Cognito/releases)
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

Cognito comes with seven distinct personas to suit different needs:

*   **Ein:** Academic researcher focused on analyzing research papers. Delivers core problem statements, key findings with data, takeaways with implications, and insightful questions grounded in the text.
*   **Warren:** Business analyst providing actionable insights on business strategies and market trends. Emphasizes data-driven decision-making, risk assessment, and strategic planning.
*   **Charlie:** Friendly assistant for answering questions, explaining concepts, and brainstorming. Prioritizes clarity, empathy, and practical support.
*   **Agatha:** Creative thinker who excels at generating innovative ideas and solutions. Emphasizes imagination, unconventional approaches, and experimentation.
*   **Jan:** Strategist skilled at logical problem-solving, critical thinking, and long-term planning. Emphasizes structured strategies, risk assessment, and adaptability.
*   **Sherlock:** Detective focused on logical reasoning and deduction. Emphasizes breaking down complex problems, step-by-step strategies, and careful analysis.
*   **Bruce:** All-around assistant proficient in a wide range of tasks, including answering questions, explaining concepts, analyzing text, writing, and brainstorming.

![](/docs/Cognito_app.png)

Web Search
![alt text](/docs/websearch.png)

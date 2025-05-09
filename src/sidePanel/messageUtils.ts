import { toPng } from 'html-to-image';
import { MessageTurn } from './ChatHistory'; // Adjust path if needed

export const downloadText = (turns: MessageTurn[]) => {
  if (!turns || turns.length === 0) return;

  const text = turns.map(turn => {
    let turnText = `${turn.role}\n`;
    // Optionally include the web prefix for assistant turns if desired in the text export
    if (turn.role === 'assistant' && turn.webDisplayContent) {
        turnText += `**From the Internet**\n${turn.webDisplayContent}\n\n---\n\n`;
    }
    turnText += turn.rawContent;
    return turnText;
}).join('\n\n');

  const element = document.createElement('a');

  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
  const filename = `chat_${(new Date().toJSON().slice(0,10))}.txt`

  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
};

export const downloadJson = (turns: MessageTurn[]) => {
  if (!turns || turns.length === 0) return;

  const text = JSON.stringify(turns, null, 2);

  const element = document.createElement('a');

  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
  const filename = `chat_${(new Date().toJSON().slice(0,10))}.json`

  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
};

export const downloadImage = (turns: MessageTurn[]) => {
  if (!turns || turns.length === 0) return; // Check the turns array

  const nodes = document.querySelectorAll<HTMLElement>('.chatMessage');
  
  if (!nodes || nodes.length === 0) { // Check if nodes exist and the list is not empty
    console.warn('No chat messages found to generate image.');
    
    return; // Exit early if no nodes found
  }

  const wrapper = document.createElement('div');

  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column-reverse';
  wrapper.style.paddingBottom = '1rem';
  wrapper.style.marginRight = '-2rem';
  wrapper.style.background = document.documentElement.style.getPropertyValue('--bg');

  nodes.forEach(n => {
    const cloned = n.cloneNode(true);

    if (cloned instanceof HTMLElement) {
    cloned.style.marginTop = '1rem';
    wrapper.appendChild(cloned);
  } else {
    // Handle cases where a node might not be an HTMLElement, though unlikely here
    console.warn('Cloned node is not an HTMLElement:', cloned);
}
});

function filter(node: Node): boolean {
  if (node instanceof Element) {
    // Exclude only the button element, not its children (like SVGs)
    if (node.className?.includes?.('chakra-button')) {
      return false;
    }
  }
  return true;
}

  document.body.appendChild(wrapper);

    toPng(wrapper, {
      filter,
      pixelRatio: 4,
      style: { flexGrow: 'unset' },
      backgroundColor: document.documentElement.style.getPropertyValue('--bg')
    })
      .then(dataUrl => {
        const img = new Image();
        
        img.src = dataUrl;
        const element = document.createElement('a');
        
        element.setAttribute('href', dataUrl);
        const filename = `chat_${(new Date().toJSON().slice(0,10))}.png`;
        
        element.setAttribute('download', filename);
        element.style.display = 'none';

        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      })
      .catch(error => {
        console.error('oops, something went wrong!', error);
      })
      .finally(() => {
         // Ensure wrapper is removed whether promise resolves or rejects
         if (document.body.contains(wrapper)) {
            document.body.removeChild(wrapper);
         }
      });
  }

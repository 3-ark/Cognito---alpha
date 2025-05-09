// src/util/ttsUtils.ts
export interface VoiceOption {
  name: string;
  lang: string;
}

export const getAvailableVoices = (): Promise<VoiceOption[]> => {
  return new Promise((resolve) => {
    // Debounce or ensure voices are loaded before resolving
    let voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      resolve(voices.map((voice) => ({ name: voice.name, lang: voice.lang })));
      return;
    }

    const handleVoicesChanged = () => {
      voices = window.speechSynthesis.getVoices();
      if (voices.length) {
        resolve(voices.map((voice) => ({ name: voice.name, lang: voice.lang })));
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged); // Clean up listener
      }
    };
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
  });
};

let currentUtterance: SpeechSynthesisUtterance | null = null;
let onEndCallback: (() => void) | null = null;
let onStartCallback: (() => void) | null = null;
let onPauseCallback: (() => void) | null = null;
let onResumeCallback: (() => void) | null = null;

// --- State Check Functions ---
export const isCurrentlySpeaking = (): boolean => window.speechSynthesis.speaking;
export const isCurrentlyPaused = (): boolean => window.speechSynthesis.paused;
// --- End State Check Functions ---


export const speakMessage = (
  text: string,
  voiceName?: string,
  rate: number = 1, // Add rate parameter with default
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onPause?: () => void;
    onResume?: () => void;
  }
) => {
  // Stop any currently playing/pending speech before starting new
  if (isCurrentlySpeaking() || window.speechSynthesis.pending) {
    console.log("Stopping previous speech before starting new.");
    stopSpeech(); // Use the enhanced stopSpeech which handles callbacks
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate; // Use the provided rate

  // Set voice if provided and found
  if (voiceName) {
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find((voice) => voice.name === voiceName);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    } else {
      console.warn(`Voice "${voiceName}" not found. Using default.`);
    }
  }

  // Store callbacks
  onStartCallback = callbacks?.onStart || null;
  onEndCallback = callbacks?.onEnd || null;
  onPauseCallback = callbacks?.onPause || null;
  onResumeCallback = callbacks?.onResume || null;

  // Attach event listeners to the utterance
  utterance.onstart = () => {
    console.log('Speech started');
    currentUtterance = utterance; // Set current utterance on actual start
    if (onStartCallback) onStartCallback();
  };

  utterance.onend = () => {
    console.log('Speech ended');
    if (currentUtterance === utterance) { // Ensure it's the correct utterance ending
        currentUtterance = null;
        if (onEndCallback) onEndCallback();
        // Clear all callbacks associated with this utterance
        onStartCallback = onEndCallback = onPauseCallback = onResumeCallback = null;
    }
  };

  utterance.onpause = () => {
    console.log('Speech paused');
     if (currentUtterance === utterance && onPauseCallback) onPauseCallback();
  };

  utterance.onresume = () => {
    console.log('Speech resumed');
     if (currentUtterance === utterance && onResumeCallback) onResumeCallback();
  };

  utterance.onerror = (event) => {
    console.error('SpeechSynthesisUtterance error:', event.error);
     if (currentUtterance === utterance) { // Ensure it's the correct utterance erroring
        currentUtterance = null;
        if (onEndCallback) onEndCallback(); // Treat error as end
        // Clear all callbacks associated with this utterance
        onStartCallback = onEndCallback = onPauseCallback = onResumeCallback = null;
     }
  };

  // Clear any potential stale utterance reference before speaking
  currentUtterance = null;
  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  if (!currentUtterance && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
    // Nothing to stop
    return;
  }
  console.log('Stopping speech');
  const callback = onEndCallback; // Capture callback before clearing
  // Clear references and callbacks immediately
  currentUtterance = null;
  onStartCallback = onEndCallback = onPauseCallback = onResumeCallback = null;

  window.speechSynthesis.cancel(); // Stop speaking and clear queue

  // Manually trigger the end callback *after* cancelling
  if (callback) {
    console.log('Manually triggering onEnd callback after stop.');
    callback();
  }
};

export const pauseSpeech = () => {
  if (isCurrentlySpeaking() && !isCurrentlyPaused()) {
    window.speechSynthesis.pause();
    // State update relies on the onpause event listener
  }
};

export const resumeSpeech = () => {
  if (isCurrentlyPaused()) {
    window.speechSynthesis.resume();
    // State update relies on the onresume event listener
  }
};

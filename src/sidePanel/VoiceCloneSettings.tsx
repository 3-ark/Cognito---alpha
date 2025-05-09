// Project: Voice Cloning App not in use yet, for further development
import { useState } from 'react';
import { Button, Box, Slider, Select } from '@chakra-ui/react';
import { AccordionItem, AccordionPanel } from '@chakra-ui/react';
import { useConfig } from './ConfigContext';
import { LocalTTSConfig } from './LocalTTSConfig';
import { CloudTTSConfig } from './CloudTTSConfig';

export const VoiceCloneSettings = () => {
  const [voiceSample, setVoiceSample] = useState<File | null>(null);
  const [voiceSimilarity, setVoiceSimilarity] = useState<number>(50);
  const [voiceCloning, setVoiceCloning] = useState<boolean>(false);
  const { config, updateConfig } = useConfig();
  const { ttsProvider } = config;
  return (
    <>
      <AccordionItem>
        <h2>TTS Settings</h2>
        <AccordionPanel>
          <Select
            value={config.ttsProvider}
            onChange={(e) => updateConfig({ ttsProvider: e.target.value })}
          >
            <option value="web">Browser TTS</option>
            <option value="local">Local Model</option>
            <option value="cloud">Cloud Service</option>
          </Select>
          
          {config.ttsProvider === 'local' && <LocalTTSConfig />}
          {config.ttsProvider === 'cloud' && <CloudTTSConfig />}
          <VoiceCloneSettings />
        </AccordionPanel>
      </AccordionItem>
    </>
  );
};
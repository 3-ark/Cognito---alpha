// src/sidePanel/TtsSettings.tsx
import { useState, useEffect } from 'react';
import {
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon, // Keep AccordionIcon if you want the default arrow
  Box,
  Select,
  Spinner,
  Text,
  Slider,            // Import Slider components
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from '@chakra-ui/react';
import { useConfig } from './ConfigContext';
import { getAvailableVoices, VoiceOption } from '../background/ttsUtils';
import { SettingTitle } from './SettingsTitle'; // Import SettingTitle

export const TtsSettings = () => {
  const { config, updateConfig } = useConfig();
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(true);
  const [errorLoading, setErrorLoading] = useState<string | null>(null);

  useEffect(() => {
    setLoadingVoices(true);
    setErrorLoading(null);
    getAvailableVoices()
      .then((availableVoices) => {
        setVoices(availableVoices);
        // Set a default voice if none is selected and voices are available
        if (!config.tts?.selectedVoice && availableVoices.length > 0) {
          // Try to find a default English voice or just the first one
          const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) || availableVoices[0];
          if (defaultVoice) {
            updateConfig({ tts: { ...config.tts, selectedVoice: defaultVoice.name } });
          }
        }
      })
      .catch((err) => {
        console.error("Error loading TTS voices:", err);
        setErrorLoading("Could not load voices. TTS might not be available.");
      })
      .finally(() => {
        setLoadingVoices(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleVoiceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVoiceName = event.target.value;
    updateConfig({
      tts: {
        ...config.tts, // Preserve other potential TTS settings
        selectedVoice: selectedVoiceName,
      },
    });
  };

  const handleRateChange = (value: number) => {
    updateConfig({
      tts: {
        ...config.tts,
        rate: value,
      },
    });
  };

  const currentRate = config.tts?.rate ?? 1; // Default to 1 if not set
  return (
    // Apply styles similar to Persona AccordionItem
    <AccordionItem
      border="2px solid var(--text)"
      borderBottomWidth="2px !important" // Ensure bottom border is also present
      borderRadius={16}
      mb={4} // Add margin bottom like in Persona
    >
      {/* Use SettingTitle within the button */}
      <AccordionButton _hover={{ backgroundColor: 'transparent' }} paddingBottom={1} paddingRight={2}>
        {/* Pass AccordionIcon as the widget prop to SettingTitle */}
        <SettingTitle
          text="Text-to-Speech"
          icon="🎤" // Use a microphone emoji or any other icon
        />
      </AccordionButton>
      {/* Adjust panel padding */}
      <AccordionPanel p={4} pt={2}> {/* Increased padding slightly */}
        {loadingVoices ? (
          <Spinner size="md" color="var(--text)" />
        ) : errorLoading ? (
          <Text color="var(--error)" fontSize="md" fontWeight="600"> {/* Style error text */}
            {errorLoading}
          </Text>
        ) : voices.length > 0 ? (
          <Select
            // Apply styles similar to Persona Select
            sx={{
             '> option': {
              background: 'var(--bg)',
              color: 'var(--text)',
              '--option-bg-contrast': 'color-mix(in srgb, var(--text) 20%, var(--bg))'
             },
            }}
            border="2px"
            borderColor="var(--text)"
            borderRadius={16}
            color="var(--text)"
            fontSize="md"
            fontWeight={600}
            size="sm" // Use smaller size consistent with Persona
            value={config.tts?.selectedVoice || ''}
            onChange={handleVoiceChange}
            _hover={{ borderColor: 'var(--text)', boxShadow: 'none !important' }} // Consistent hover/focus
            _focus={{ borderColor: 'var(--text)', boxShadow: 'none !important' }}
            placeholder="Select voice" // Keep placeholder if desired
            // Removed bg="var(--bg)" as it might conflict with sx option styling, test this
          >
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </Select>
        ) : (
          <Text color="var(--text)" fontSize="md" fontWeight="600"> {/* Style 'no voices' text */}
            No voices available in this browser.
          </Text>
        )}

        {/* Rate Slider */}
        {!loadingVoices && !errorLoading && voices.length > 0 && ( // Only show slider if voices loaded successfully
          <Box mt={4}>
            <Text color="var(--text)" fontSize="md" fontWeight="600" mb={2}>
              Speech Rate ({currentRate.toFixed(1)})
            </Text>
            <Slider
              min={0.5} // Min rate
              max={2}   // Max rate
              step={0.1} // Step increment
              value={currentRate}
              onChange={handleRateChange}
            >
              <SliderTrack bg="var(--text-muted)"> {/* Use a muted track color */}
                <SliderFilledTrack bg="var(--text)" />
              </SliderTrack>
              <SliderThumb bg="var(--text)" boxSize={5} /> {/* Slightly larger thumb */}
            </Slider>
          </Box>
        )}
      </AccordionPanel>
    </AccordionItem>
  );
};

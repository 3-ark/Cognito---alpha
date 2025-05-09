import { useConfig } from './ConfigContext';
import {
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  FormLabel,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react';
import { SettingTitle } from './SettingsTitle'; // Assuming SettingTitle is here

export const ModelSettingsPanel = () => {
  const { config, updateConfig } = useConfig();

  const handleChange = (key: keyof typeof config) => (val: number) => {
    updateConfig({ [key]: val });
  };

  // Default values for display if config values are null/undefined
  const temperature = config.temperature ?? 0.7;
  const maxTokens = config.maxTokens ?? 2048;
  const topP = config.topP ?? 1; // Keep topP as Gemini supports it
  const presencePenalty = config.presencePenalty ?? 0;

  return (
    <AccordionItem> {/* Removed border styling, handled by parent Accordion sx */}
      <AccordionButton>
        <SettingTitle icon="⚙️" text="Model Parameters" />
      </AccordionButton>
      <AccordionPanel pb={4}> {/* Use AccordionPanel for content */}
        {/* Removed outer Box margins, handled by AccordionPanel padding */}
        <FormLabel>Temperature ({temperature.toFixed(2)})</FormLabel>
        <Slider min={0} max={1} step={0.01} value={temperature} onChange={handleChange('temperature')}>
          <SliderTrack><SliderFilledTrack /></SliderTrack><SliderThumb />
        </Slider>

        <FormLabel mt={4}>Max Tokens ({maxTokens})</FormLabel>
        <NumberInput value={maxTokens} min={1} max={1280000} onChange={(_, value) => handleChange('maxTokens')(value)}>
          <NumberInputField />
        </NumberInput>

        <FormLabel mt={4}>Top P ({topP.toFixed(2)})</FormLabel>
        <Slider min={0} max={1} step={0.01} value={topP} onChange={handleChange('topP')}>
          <SliderTrack><SliderFilledTrack /></SliderTrack><SliderThumb />
        </Slider>

        <FormLabel mt={4}>Presence Penalty ({presencePenalty.toFixed(1)})</FormLabel>
        <Slider min={-2} max={2} step={0.1} value={presencePenalty} onChange={handleChange('presencePenalty')}>
          <SliderTrack><SliderFilledTrack /></SliderTrack><SliderThumb />
        </Slider>
      </AccordionPanel>
    </AccordionItem>
  );
};

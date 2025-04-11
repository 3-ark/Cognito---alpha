import React from 'react';
import {
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Text,
  Tooltip
} from '@chakra-ui/react';

import { useConfig } from './ConfigContext';
import { SettingTitle } from './SettingsTitle';

type Theme = {
  name: string;
  active: string;
  bg: string;
  text: string;
}

export const themes = [
  { name: 'paper', active: '#dcc299', bg: '#F5E9D5', text: '#5B4636'},
  { name: 'smoke', active: '#bab8b8', bg: '#dfdfdf', text: '#333' },
  { name: 'moss', active: '#a4b086', bg: '#EFD6AC', text: 'black' },
  { name: 'seasalt', active: '#C2E7B5', bg: '#c2e7b5', text: '#333' },
];

export const setTheme = (c: Theme) => {
  localStorage.setItem('theme', c.name);
  document.documentElement.style.setProperty('--active', c.active);
  document.documentElement.style.setProperty('--bg', c.bg);
  document.documentElement.style.setProperty('--text', c.text);
};

const ThemeButton = ({ theme, updateConfig }: { theme: Theme, updateConfig: Function }) => (
  <Tooltip aria-label={theme.name} background="var(--bg)" color="var(--text)" label={theme.name}>
    <Button
      _hover={{
        background: theme.active,
        border: '3px solid var(--text)',
        boxShadow: '3px'
      }}
      background={theme.active}
      border="2px solid var(--text)"
      borderRadius={16}
      color="var(--text)"
      mb={2}
      mr={2}
      size="md"
      onClick={() => {
        updateConfig(theme.name);
        setTheme(theme);
      }}
    />
  </Tooltip>

);

export const Themes = () => {
  const { config, updateConfig } = useConfig();
  const currentFontSize = config?.fontSize || 12;

  return (
    <AccordionItem border="2px solid var(--text)" borderRadius={16} mb={4} mt={0}>
      <AccordionButton _hover={{ backgroundColor: 'transparent' }} paddingBottom={1} paddingRight={2}>
        <SettingTitle icon="🎨" padding={0} text="general" />
      </AccordionButton>
      <AccordionPanel pb={4}>
        <Box>
          <Text onClick={() => updateConfig({ generateTitle: !config?.generateTitle })} alignItems="center" color="var(--text)" display="flex" fontSize="lg" fontWeight={800} pb={2} textAlign="left" cursor="pointer">
          <input checked={config?.generateTitle} style={{ marginRight: '0.5rem' }} type="checkbox" onChange={() => updateConfig({ generateTitle: !config?.generateTitle })} />
            create chat title
          </Text>
          <Text onClick={() => updateConfig({ backgroundImage: !config?.backgroundImage })}  alignItems="center" color="var(--text)" display="flex" fontSize="lg" fontWeight={800} pb={2} textAlign="left" cursor="pointer">
          <input checked={config?.backgroundImage} style={{ marginRight: '0.5rem' }} type="checkbox" onChange={() => updateConfig({ backgroundImage: !config?.backgroundImage })} />
            background illustration
          </Text>
          <Text color="var(--text)" fontSize="lg" fontWeight={800} pb={2} pt={2} textAlign="left">
            font size
            <Slider
              defaultValue={currentFontSize}
              id="slider"
              max={20}
              min={7}
              onChange={e => {
                updateConfig({ fontSize: e });
              }}
            >
              <SliderTrack background="var(--text)">
                <SliderFilledTrack background="var(--text)" />
              </SliderTrack>
              <SliderThumb background="var(--text)" style={{ zoom: 1.5 }} />
            </Slider>
          </Text>
        </Box>
        <Box>
          <Text color="var(--text)" fontSize="lg" fontWeight={800} pb={2} textAlign="left">theme</Text>
          <Box display="flex" flexWrap="wrap">
            {themes.map((theme, index) => (
              <ThemeButton key={theme.name} theme={theme} updateConfig={updateConfig} />
            ))}
          </Box>
        </Box>
      </AccordionPanel>
    </AccordionItem>
  );
};

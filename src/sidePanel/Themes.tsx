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
  Tooltip,
  Input,
  Flex,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  Checkbox,
} from '@chakra-ui/react';
import { useConfig } from './ConfigContext';
import { SettingTitle } from './SettingsTitle';
import { useState, useEffect } from 'react';
import { Config } from '../types/config';
import storage from '../background/storageUtil';

type Theme = {
  name: string;
  active: string;
  bg: string;
  text: string;
  bold: string;
  italic: string;
  link: string;
  codeBg: string;
  codeFg: string;
  preBg: string;
  preFg: string;
  tableBorder: string;
  error: string;
  success: string;
  warning: string;
};

export const themes: Theme[] = [
  {
    name: 'paper',
    active: '#dcc299',
    bg: '#F5E9D5',
    text: '#5B4636',
    bold: '#af1b1b',
    italic: '#036427',
    link: '#003bb9',
    codeBg: '#5B4636', // text
    codeFg: '#F5E9D5', // bg
    preBg: '#5B4636', // text
    preFg: '#F5E9D5', // bg
    tableBorder: '#5B4636',
    error: '#d32f2f',
    success: '#388e3c',
    warning: '#fbc02d',
  },
  {
    name: 'smoke',
    active: '#939393',
    bg: '#dfdfdf',
    text: '#000000',
    bold: '#eafadb',
    italic: '#fbe1cf',
    link: '#c3d5fa',
    codeBg: '#333333', // text
    codeFg: '#dfdfdf', // bg
    preBg: '#333333', // text
    preFg: '#dfdfdf', // bg
    tableBorder: '#333333',
    error: '#d32f2f',
    success: '#388e3c',
    warning: '#fbc02d',
  },
  {
    name: 'moss',
    active: '#a4b086',
    bg: '#EFD6AC',
    text: '#333333',
    bold: '#af1b1b',
    italic: '#6349b3',
    link: '#4367b6',
    codeBg: '#333333', // text
    codeFg: '#EFD6AC', // bg
    preBg: '#333333', // text
    preFg: '#EFD6AC', // bg
    tableBorder: '#6349b3',
    error: '#d32f2f',
    success: '#388e3c',
    warning: '#fbc02d',
  },
  {
    name: 'dark',
    active: '#7473af',
    bg: '#373737',
    text: '#e3e3e3',
    bold: '#eb9500',
    italic: '#97e9b5',
    link: '#8aa8e8',
    codeBg: '#e3e3e3', // text
    codeFg: '#373737', // bg
    preBg: '#e3e3e3', // text
    preFg: '#373737', // bg
    tableBorder: '#e3e3e3',
    error: '#d32f2f',
    success: '#388e3c',
    warning: '#fbc02d',
  },
  {
    name: 'custom',
    active: '#7473af',
    bg: '#393939',
    text: '#e3e3e3',
    bold: '#af1b1b',
    italic: '#09993e',
    link: '#003bb9',
    codeBg: '#e3e3e3', // text
    codeFg: '#393939', // bg
    preBg: '#e3e3e3', // text
    preFg: '#393939', // bg
    tableBorder: '#e3e3e3',
    error: '#d32f2f',
    success: '#388e3c',
    warning: '#fbc02d',
  },
];

// Update setTheme to accept the full config or relevant parts
export const setTheme = (c: Theme, paperTextureEnabled: boolean = true) => {
  // Apply data attribute for global texture control
  document.documentElement.dataset.paperTexture = String(paperTextureEnabled);
  storage.setItem('theme', c.name);
  document.documentElement.style.setProperty('--active', c.active);
  document.documentElement.style.setProperty('--bg', c.bg);
  document.documentElement.style.setProperty('--text', c.text);
  document.documentElement.style.setProperty('--bold', c.bold);
  document.documentElement.style.setProperty('--italic', c.italic);
  document.documentElement.style.setProperty('--link', c.link);

  // Markdown and UI variables
  document.documentElement.style.setProperty('--markdown-h1', c.bold);
  document.documentElement.style.setProperty('--markdown-h2', c.italic);
  document.documentElement.style.setProperty('--markdown-h3', c.text);
  document.documentElement.style.setProperty('--markdown-strong', c.bold);
  document.documentElement.style.setProperty('--markdown-em', c.italic);
  document.documentElement.style.setProperty('--markdown-link', c.link);
  document.documentElement.style.setProperty('--markdown-code-bg', c.codeBg);
  document.documentElement.style.setProperty('--markdown-code-fg', c.codeFg);
  document.documentElement.style.setProperty('--markdown-pre-bg', c.preBg);
  document.documentElement.style.setProperty('--markdown-pre-fg', c.preFg);
  document.documentElement.style.setProperty('--markdown-table-border', c.tableBorder);

  // Status colors
  document.documentElement.style.setProperty('--error', c.error);
  document.documentElement.style.setProperty('--success', c.success);
  document.documentElement.style.setProperty('--warning', c.warning);
};

const ThemeButton = ({ theme, updateConfig }: { theme: Theme; updateConfig: (newConfig: Partial<Config>) => void }) => (
  <Tooltip aria-label={theme.name} background="var(--bg)" color="var(--text)" label={theme.name}>
    <Button
      _hover={{
        background: theme.active,
        border: '3px solid var(--text)',
        boxShadow: '3px',
      }}
      background={theme.active}
      border="2px solid var(--text)"
      borderRadius={16}
      color="var(--text)"
      size="md"
      onClick={() => {
        updateConfig({ theme: theme.name });
        setTheme(theme);
      }}
    />
  </Tooltip>
);

const CustomThemePicker = ({ updateConfig, config }: { updateConfig: (newConfig: Partial<Config>) => void; config: Config }) => {
  // Initialize with config.customTheme if it exists, otherwise use the themes array's custom theme
  const [customTheme, setCustomTheme] = useState(
    config?.customTheme ||
      themes.find((t) => t.name === 'custom') || {
        active: '#b5d4aa',
        bg: '#245612',
        text: '#efeaea',
        bold: '#fbd709',
        italic: '#09993e',
        link: '#587bc5',
        codeBg: '#efeaea', // text
        codeFg: '#245612', // bg
        preBg: '#efeaea', // text
        preFg: '#245612', // bg
        tableBorder: '#efeaea', // text
        error: '#fbd709', // bold
        success: '#587bc5', // link
        warning: '#fbd709', // bold
      }
  );

  const handleColorChange = (key: keyof Omit<Theme, 'name'>, value: string) => {
    let newTheme = { ...customTheme, [key]: value };

    if (key === 'text') {
      newTheme = {
        ...newTheme,
        codeBg: value,
        preBg: value,
        error: newTheme.bold,
        warning: newTheme.bold,
      };
      if (customTheme.bg) {
        newTheme.codeFg = customTheme.bg;
        newTheme.preFg = customTheme.bg;
      }
      if (customTheme.link) {
        newTheme.success = customTheme.link;
      }
    }
    if (key === 'bg') {
      newTheme = {
        ...newTheme,
        codeFg: value,
        preFg: value,
      };
      if (customTheme.text) {
        newTheme.codeBg = customTheme.text;
        newTheme.preBg = customTheme.text;
      }
    }
    if (key === 'bold') {
      newTheme = {
        ...newTheme,
        error: value,
        warning: value,
      };
    }
    if (key === 'link') {
      newTheme = {
        ...newTheme,
        success: value,
      };
    }

    setCustomTheme(newTheme);

    updateConfig({
      customTheme: { ...newTheme, name: 'custom' }, // Ensure name is included when updating config
      theme: 'custom',
    });
  };

  return (
    <Popover>
      <Tooltip aria-label="custom" background="var(--bg)" color="var(--text)" label="custom">
        <Box display="inline-block">
          {' '}
          <PopoverTrigger> 
            <Button
              _hover={{
                background: customTheme.active,
                border: '3px solid var(--text)',
                boxShadow: '3px',
              }}
              background={customTheme.active}
              border="2px solid var(--text)"
              borderRadius={16}
              color={customTheme.text}
              size="md"
            />
          </PopoverTrigger>
        </Box>
      </Tooltip>
      <PopoverContent width="280px" zIndex="popover"> {/* Reset zIndex, rely on stacking context fix */}
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverHeader>Custom Theme Colors</PopoverHeader>
        <PopoverBody>
          <Flex direction="column" gap={2}>
            <Flex align="center">
              <Text width="80px">Bg:</Text>
              <Input type="color" value={customTheme.bg} onChange={(e) => handleColorChange('bg', e.target.value)} />
            </Flex>
            <Flex align="center">
              <Text width="80px">Text:</Text>
              <Input type="color" value={customTheme.text} onChange={(e) => handleColorChange('text', e.target.value)} />
            </Flex>
            <Flex align="center">
              <Text width="80px">Active:</Text>
              <Input type="color" value={customTheme.active} onChange={(e) => handleColorChange('active', e.target.value)} />
            </Flex>
            <Flex align="center">
              <Text width="80px">Bold:</Text>
              <Input type="color" value={customTheme.bold} onChange={(e) => handleColorChange('bold', e.target.value)} />
            </Flex>
            <Flex align="center">
              <Text width="80px">Italic:</Text>
              <Input type="color" value={customTheme.italic} onChange={(e) => handleColorChange('italic', e.target.value)} />
            </Flex>
            <Flex align="center">
              <Text width="80px">Link:</Text>
              <Input type="color" value={customTheme.link} onChange={(e) => handleColorChange('link', e.target.value)} />
            </Flex>
          </Flex>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export const Themes = () => {
  const { config, updateConfig } = useConfig();
  const currentFontSize = config?.fontSize || 12;

  // Apply theme, texture, and font size settings on load/change
  useEffect(() => {
    const currentThemeName = config?.theme || 'paper';
    const isCustom = currentThemeName === 'custom';
    const themeDefinition = isCustom
      ? { name: 'custom', ...(config?.customTheme || themes.find((t) => t.name === 'custom')) }
      : themes.find((t) => t.name === currentThemeName) || themes.find((t) => t.name === 'paper'); // Fallback

    if (themeDefinition) {
      // Pass the paperTexture setting to setTheme
      setTheme(themeDefinition as Theme, config?.paperTexture ?? true);
    }
    // Apply font size
    if (config?.fontSize) {
      document.documentElement.style.setProperty('--global-font-size', `${config.fontSize}px`);
    }
    // Add fontSize dependency
  }, [config?.theme, config?.customTheme, config?.paperTexture, config?.fontSize]);

  return (
    <AccordionItem border="2px solid var(--text)" borderRadius={16} mb={4} mt={0}>
      <AccordionButton _hover={{ backgroundColor: 'transparent' }} paddingBottom={1} paddingRight={2}>
        <SettingTitle icon="🎨" text="Themes" />
      </AccordionButton>
      {/* Use Flex column for the entire panel content */}
      <AccordionPanel pb={4}>
        <Flex direction="column" gap={4}> {/* Add gap between sections */}
          <Flex direction="column" gap={2}> {/* Checkboxes section */}
            <Checkbox
              color="var(--text)"
              fontWeight={800}
              fontSize="lg"
              colorScheme="blackAlpha"
              isChecked={config?.generateTitle ?? false}
              onChange={(e) => {
                updateConfig({ generateTitle: e.target.checked });
              }}
              onClick={(e) => e.stopPropagation()} // Prevent accordion from toggling
            >
              create chat title
            </Checkbox>

            <Checkbox
              color="var(--text)"
              fontWeight={800}
              fontSize="lg"
              colorScheme="blackAlpha"
              isChecked={config?.backgroundImage ?? false}
              onChange={(e) => {
                updateConfig({ backgroundImage: e.target.checked });
              }}
              onClick={(e) => e.stopPropagation()} // Prevent accordion from toggling
            >
              background illustration
            </Checkbox>

            <Checkbox
              color="var(--text)"
              fontWeight={800}
              fontSize="lg"
              colorScheme="blackAlpha"
              // Default paperTexture to true if undefined in config
              isChecked={config?.paperTexture ?? true}
              onChange={(e) => {
                const newPaperTextureState = e.target.checked;
                updateConfig({ paperTexture: newPaperTextureState });
                // Re-apply theme immediately when texture changes to update the data attribute
                // Need to determine the current theme object here
                const currentThemeName = config?.theme || 'paper';
                const isCustom = currentThemeName === 'custom';
                const currentTheme = isCustom
                  ? { name: 'custom', ...(config?.customTheme || themes.find((t) => t.name === 'custom')) }
                  : themes.find((t) => t.name === currentThemeName) || themes.find((t) => t.name === 'paper');

                if (currentTheme) {
                  setTheme(currentTheme as Theme, newPaperTextureState);
                }
              }}
              onClick={(e) => e.stopPropagation()} // Prevent accordion from toggling
            >
              paper texture
            </Checkbox>
          </Flex>

          <Box> {/* Font size section */}
            <Text color="var(--text)" fontSize="lg" fontWeight={800} pb={2} textAlign="left">font size</Text>
            <Slider
              defaultValue={currentFontSize}
              id="slider"
              max={20}
              min={7}
              onChange={(e) => {
                // Update config, useEffect will handle applying the style
                updateConfig({ fontSize: e });
              }}
            >
              <SliderTrack background="var(--text)">
                <SliderFilledTrack background="var(--text)" />
              </SliderTrack>
              <SliderThumb background="var(--text)" style={{ zoom: 1.5 }} />
            </Slider>
          </Box>

          <Box> {/* Theme selection section */}
            <Text color="var(--text)" fontSize="lg" fontWeight={800} pb={2} textAlign="left">theme</Text>
            {/* Use Flex wrap and gap for theme buttons */}
            <Flex wrap="wrap" gap={2}>
              {themes
                .filter((t) => t.name !== 'custom')
                .map((theme) => (
                  <ThemeButton key={theme.name} theme={theme} updateConfig={updateConfig} />
                ))}
              <CustomThemePicker updateConfig={updateConfig} config={config} />
            </Flex>
          </Box>
        </Flex>
      </AccordionPanel>
    </AccordionItem>
  );
};

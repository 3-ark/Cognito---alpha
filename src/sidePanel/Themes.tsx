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
    PopoverBody
  } from '@chakra-ui/react';
  import { useConfig } from './ConfigContext';
  import { SettingTitle } from './SettingsTitle';
  import { useState, useEffect } from 'react';
  import { Config } from '../types/config';
  import storage from '../util/storageUtil';
  
  type Theme = {
    name: string;
    active: string;
    bg: string;
    text: string;
  }
  
  export const themes = [
    {
      name: 'paper', active: '#dcc299', bg: '#F5E9D5', text: '#5B4636'
    },
    {
      name: 'smoke', active: '#bab8b8', bg: '#dfdfdf', text: '#333333' 
    },
    {
      name: 'moss', active: '#a4b086', bg: '#EFD6AC', text: '#333333' 
    },
    {
      name: 'custom', active: '#C2E7B5', bg: '#c2e7b5', text: '#333333' 
    }
  ];
  
  export const setTheme = (c: Theme) => {
    storage.setItem('theme', c.name);
    document.documentElement.style.setProperty('--active', c.active);
    document.documentElement.style.setProperty('--bg', c.bg);
    document.documentElement.style.setProperty('--text', c.text);
  };
  
  const ThemeButton = ({ theme, updateConfig }: { theme: Theme, updateConfig: (newConfig: Partial<Config>) => void }) => (
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
          updateConfig({ theme: theme.name });
          setTheme(theme);
        }}
      />
    </Tooltip>
  );
  
  const CustomThemePicker = ({ updateConfig, config }: { updateConfig: (newConfig: Partial<Config>) => void, config: Config }) => {
    // Initialize with config.customTheme if it exists, otherwise use the themes array's custom theme
    const [customTheme, setCustomTheme] = useState(
      config?.customTheme || themes.find(t => t.name === 'custom') || {
        active: '#C2E7B5',
        bg: '#c2e7b5',
        text: '#333333'
      }
    );
    
    const handleColorChange = (key: keyof typeof customTheme, value: string) => {
      const newTheme = { ...customTheme, [key]: value };
      setCustomTheme(newTheme);
      
      // Update the custom theme in the config and set theme to custom
      updateConfig({ 
        customTheme: newTheme,
        theme: 'custom'
      });
      
      // Apply the theme immediately
      setTheme({ name: 'custom', ...newTheme });
    };
  
      return (
        <Popover>
          <Tooltip aria-label="custom" background="var(--bg)" color="var(--text)" label="custom">
            <Box display="inline-block"> {/* Wrapper to make Tooltip work with PopoverTrigger */}
              <PopoverTrigger>
                <Button
                  _hover={{
                    background: customTheme.active,
                    border: '3px solid var(--text)',
                    boxShadow: '3px'
                  }}
                  background={customTheme.active}
                  border="2px solid var(--text)"
                  borderRadius={16}
                  color={customTheme.text}
                  mb={2}
                  mr={2}
                  size="md"
                />
              </PopoverTrigger>
            </Box>
          </Tooltip>
          <PopoverContent>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader>Custom Theme Colors</PopoverHeader>
            <PopoverBody>
              <Flex direction="column" gap={2}>
                <Flex align="center">
                  <Text width="80px">Background:</Text>
                  <Input
                    type="color"
                    value={customTheme.bg}
                    onChange={(e) => handleColorChange('bg', e.target.value)}
                  />
                </Flex>
                <Flex align="center">
                  <Text width="80px">Text:</Text>
                  <Input
                    type="color"
                    value={customTheme.text}
                    onChange={(e) => handleColorChange('text', e.target.value)}
                  />
                </Flex>
                <Flex align="center">
                  <Text width="80px">Active:</Text>
                  <Input
                    type="color"
                    value={customTheme.active}
                    onChange={(e) => handleColorChange('active', e.target.value)}
                  />
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
  
    // Load custom theme from config if it exists
    useEffect(() => {
      if (config?.theme === 'custom' && config?.customTheme) {
        setTheme({ name: 'custom', ...config.customTheme });
      }
    }, [config?.theme, config?.customTheme]);
  
    return (
      <AccordionItem border="2px solid var(--text)" borderRadius={16} mb={4} mt={0}>
        <AccordionButton _hover={{ backgroundColor: 'transparent' }} paddingBottom={1} paddingRight={2}>
          <SettingTitle icon="🎨" padding={0} text="appearance" />
        </AccordionButton>
        <AccordionPanel pb={4}>
          <Box>
            <Text alignItems="center" color="var(--text)" cursor="pointer" display="flex" fontSize="lg" fontWeight={800} pb={2} textAlign="left" onClick={() => updateConfig({ generateTitle: !config?.generateTitle })}>
              <input checked={config?.generateTitle} style={{ marginRight: '0.5rem' }} type="checkbox" onChange={() => updateConfig({ generateTitle: !config?.generateTitle })} />
              create chat title
            </Text>
            <Text alignItems="center" color="var(--text)" cursor="pointer" display="flex" fontSize="lg" fontWeight={800} pb={2} textAlign="left" onClick={() => updateConfig({ backgroundImage: !config?.backgroundImage })}>
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
              {themes.filter(t => t.name !== 'custom').map((theme) => (
                <ThemeButton key={theme.name} theme={theme} updateConfig={updateConfig} />
              ))}
              <CustomThemePicker updateConfig={updateConfig} config={config} />
            </Box>
          </Box>
        </AccordionPanel>
      </AccordionItem>
    );
  };
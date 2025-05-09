// src/sidePanel/Settings.tsx
import { Accordion, Box } from '@chakra-ui/react';
import { useConfig } from './ConfigContext';
import { Connect } from './Connect';
import { PageContext } from './PageContext';
import { ModelSettingsPanel } from './ModelSettingsPanel';
import { Persona } from './Persona';
import { Themes } from './Themes';
import { TtsSettings } from './TtsSettings';
import { WebSearch } from './WebSearch'; // Remove unused imports


export const Settings = () => {
  const { config } = useConfig();
  const defaultIndex = (config?.models || [])?.length === 0 ? 1 : undefined;
  const isDark = config?.theme === 'dark';

  // Define control styles (can be adjusted or moved to theme variables if preferred)
  const controlBg = isDark
    ? 'rgba(255, 255, 255, 0.04)'
    : 'rgba(255, 250, 240, 0.6)';
  const controlFilter = 'brightness(1.02) contrast(0.98)';
  const subtleBorderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const floatingShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
  const hoverFilter = `${controlFilter} brightness(0.98)`;

  return (
    <Box
      id="settings"
      position="relative"
      zIndex={1} // Ensure it stacks above the texture
      top={0}
      width="100%"
      height="100%" // Ensure it covers the full height
      display="flex"
      flexDir="column"
      overflowY="scroll" // Allow scrolling for content
      overflowX="hidden" // Use conditional background
      bg="var(--bg)" // Set base background
      color="var(--text)"
      // Apply texture and consistent padding like the drawer
      px="1.5rem" // Horizontal padding like the drawer's VStack
      pt="56px" // Keep padding-top to account for the fixed Header height
      pb={4} // Bottom padding
    >
      {/* Accordion container */}
      <Accordion
        defaultIndex={defaultIndex}
        // Removed marginTop, maxWidth, ml, mr - handled by parent Box padding
        width="100%" // Take full width within the padded Box
        allowToggle
        reduceMotion
        // Apply styling consistent with drawer controls to Accordion items
        sx={{
          '.chakra-accordion__item': {
            border: 'none', // Remove default accordion item borders
            borderRadius: 'xl', // Make rounder
            boxShadow: floatingShadow,
            bg: controlBg,
            // filter: controlFilter, // Remove filter to avoid creating stacking context
            borderColor: subtleBorderColor,
            borderWidth: '1px',
            // overflow: 'hidden', // Temporarily remove to test panel height
            mb: 4, // Add margin between accordion items
            _last: { mb: 0 } // No margin for the last item
          },
          '.chakra-accordion__button': {
             bg: controlBg, // Use the control background
             color: 'var(--text)',
             fontWeight: 'medium', // Match drawer button weight
             fontSize: 'lg', // Match drawer button size (adjust if needed)
             h: '36px', // Explicit height like drawer buttons
             // py: 2, // Remove py if using h
             px: 4, // Horizontal padding for button
             borderColor: subtleBorderColor,
             borderWidth: '1px',
             borderRadius: 'xl', // Match drawer button roundness (applied here for consistency)
             boxShadow: floatingShadow, // Add the shadow
             filter: controlFilter, // Add the filter
             _hover: {
               bg: controlBg, // Keep control background on hover (like drawer)
               filter: hoverFilter,
               borderColor: 'var(--active)',
             },
             _focus: {
                boxShadow: 'none', // Remove default focus ring if desired
             },
             _active: { // Add active style to match drawer button click
                bg: 'var(--active)',
                filter: 'brightness(0.95)',
             },
             // Ensure title (SettingTitle) aligns correctly
             '> div': { // Target the inner div holding the title/widget
                width: '100%',
             }
          },
          '.chakra-accordion__panel': {
            pt: 2, // Add some top padding (adjust value as needed)
            pb: 4, // Panel bottom padding
            px: 4, // Panel horizontal padding
            bg: 'transparent', // Panel itself is transparent
          },
          '.chakra-accordion__icon': {
             color: 'var(--text)', // Style the expand/collapse icon
             ml: 2,
          }
        }}
      >
        {/* Render Accordion Items */}
        <Themes />
        <Connect />
        <ModelSettingsPanel />
        <Persona />
        <TtsSettings />
        <PageContext />
        <WebSearch />
      </Accordion>
    </Box>
  );
};

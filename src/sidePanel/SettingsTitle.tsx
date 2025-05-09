import { Box, Text } from '@chakra-ui/react';

interface SettingTitleProps {
  text?: string;
  widget?: React.ReactNode;
  // padding?: number; // Removed padding prop, handled by AccordionButton
  icon?: string;
}

export const SettingTitle = ({
 text = '', widget = <></>, icon = ''
}: SettingTitleProps) => (
  // This Text component now represents the content *inside* the AccordionButton
  <Box // Changed outer element to Box for better flex control
    display="flex"
    alignItems="center" // Align icon, text, and widget vertically
    justifyContent="space-between"
    width="100%"
    // Removed padding, fontSize, fontWeight - these are now controlled by AccordionButton styles
  >
    {/* Left side: Icon + Text */}
    <Box display="flex" alignItems="center">
      {icon && (
        <Text
          as="span" // Use span for inline display
          color="var(--text)"
          fontSize="1.25rem" // Keep icon size distinct if needed
          lineHeight="1" // Adjust line height for better alignment
          mr={3} // Keep margin-right
          // Removed padding, fontWeight, etc.
        >
          {icon}
        </Text>
      )}
      {/* Apply drawer title styles here */}
      <Text
        as="span" // Use span for inline display
        color="var(--text)"
        opacity={0.9} // Slightly less opaque than drawer titles for hierarchy
        fontSize="md" // Slightly smaller than drawer section titles
        fontWeight="medium" // Match drawer button weight
        textTransform="none" // Keep original case for accordion titles
        // Removed padding, width, textAlign, etc.
      >
        {text}
      </Text>
    </Box>

    {/* Right side: Widget */}
    <Box ml={2}> {/* Add some margin if widget exists */}
      {widget}
    </Box>
  </Box>
);

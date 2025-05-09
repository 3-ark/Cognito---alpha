import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Heading,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader as ChakraModalHeader,
  ModalOverlay,
  Select,
  Text,
  Tooltip,
  useDisclosure,
  Link,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import React from 'react';
import { FiSettings, FiX, FiTrash2 } from 'react-icons/fi';
import { IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';
import { WiMoonWaxingCrescent1 } from 'react-icons/wi';
import { useConfig } from './ConfigContext';
import { useUpdateModels } from './hooks/useUpdateModels';
import { themes, setTheme } from './Themes';

// --- Interfaces (Model, Config, ConfigContextType) remain the same ---
interface Model {
  id: string;
  active: boolean;
  host?: string;
  context_length?: number;
}
interface Config {
  theme?: string;
  persona?: string;
  personas?: Record<string, any>;
  selectedModel?: string;
  models?: Model[];
  customTheme?: any;
  fontSize?: number;
  generateTitle?: boolean;
  backgroundImage?: boolean;
}
interface ConfigContextType {
  config: Config;
  updateConfig: (newConfig: Partial<Config>) => void;
}


// --- WelcomeModal remains the same ---
const WelcomeModal = ({ isOpen, onClose, setSettingsMode }) => (
  <Modal
    isOpen={isOpen}
    scrollBehavior="inside"
    size="sm"
    isCentered
    onClose={onClose}
  >
    <ModalOverlay bg="blackAlpha.600" />
    <ModalContent
      bg="var(--bg)"
      color="var(--text)"
      borderRadius="lg"
      pb={4}
      boxShadow="lg"
      border="1px solid var(--text)"
    >
      <ChakraModalHeader
        textAlign="center"
        fontWeight="bold"
        borderBottom="1px solid var(--text)"
        borderColor="rgba(0,0,0,0.1)"
      >
        👋 Welcome Detective 👋
      </ChakraModalHeader>
      <ModalBody pt={6}>
        <Text
          color="var(--text)"
          fontSize="md"
          fontWeight="medium"
          textAlign="center"
          mb={6}
        >
          The Game Is Afoot!<br />
        </Text>
        <Flex justifyContent="center">
          <Button
            bg="var(--active)"
            color="var(--text)"
            borderRadius="md"
            leftIcon={<FiSettings />}
            onClick={() => setSettingsMode(true)}
            boxShadow="sm"
            border="1px solid var(--text)"
            _hover={{ filter: 'brightness(0.95)', boxShadow: 'md' }}
            _active={{ filter: 'brightness(0.9)' }}
          >
            Open Settings
          </Button>
        </Flex>
      </ModalBody>
    </ModalContent>
  </Modal>
);

// --- Badge remains the same ---
const Badge = ({ children }) => (
  <Box
    bg="var(--bg)"
    color="var(--text)"
    border="1px solid var(--text)"
    borderRadius="md"
    px={3}
    py={0}
    fontFamily={"'poppins', sans-serif"}
    fontStyle={"normal"}
    fontSize="md"
    fontWeight="medium"
    display="inline-block"
    whiteSpace="nowrap"
    overflow="hidden"
    textOverflow="ellipsis"
    width="100%"
    boxShadow="xs"
  >
    {children}
  </Box>
);

// --- Settings Drawer Implementation with adjustments ---
const SettingsDrawer = ({
  isOpen,
  onClose,
  config,
  updateConfig,
  availableModelNames,
  setSettingsMode,
  downloadText,
  downloadJson,
  downloadImage,
  setHistoryMode,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [inputFocused, setInputFocused] = React.useState(false);
  const { fetchAllModels } = useUpdateModels();

  const filteredModels =
    config?.models?.filter(
      (model) =>
        model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.host?.toLowerCase()?.includes(searchQuery.toLowerCase())
    ) || [];

  // Theme toggle function
  const toggleTheme = () => {
    const currentThemeName = config?.theme || 'paper';
    const nextThemeName = currentThemeName === 'dark' ? 'paper' : 'dark';
    const paperTextureEnabled = config?.paperTexture ?? true; // Get current texture state
    const nextTheme = themes.find((t) => t.name === nextThemeName);
    if (nextTheme) {
      updateConfig({ theme: nextThemeName }); // Only update theme name here
      setTheme(nextTheme);
    }
  };

  const isDark = config?.theme === 'dark';

  // Define subtle border color
  const subtleBorderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  // Define floating shadow
  const floatingShadow =
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'; // Chakra 'md' shadow

  // Define larger size for interactive elements
  const controlSize = 'md'; // Use Chakra's large size for Select, Input, Button

  // Define horizontal padding for buttons (adjust as needed)
  const buttonPaddingX = '1rem'; // Horizontal padding for buttons (internal to button)
  const sectionPaddingX = '1.5rem'; // *** UPDATED: Horizontal padding for sections ***

  // Define a slightly brighter background for controls
  // We use rgba to slightly lighten/darken the base --bg color
  // Adjust the alpha (last value) or color values as needed
  const controlBg = isDark
    ? 'rgba(255, 255, 255, 0.04)' // Slightly lighter than pitch black for dark mode
    : 'rgba(255, 250, 240, 0.6)'; // A slightly creamy/off-white for paper mode

  // Define a subtle filter to apply to controls for a hint of texture/difference
  const controlFilter = 'brightness(1.02) contrast(0.98)'; // Subtle brightness/contrast shift

  return (
    <Drawer isOpen={isOpen} placement="left" size="sm" onClose={onClose}>
      <DrawerOverlay bg="blackAlpha.500" />
<DrawerContent // Add the class here for CSS targeting
    className="settings-drawer-content"
    bg="var(--bg)" // Main background
    color="var(--text)"
    boxShadow="xl"
    borderRightWidth={0}
    borderRadius={0}
    sx={{
        position: 'relative', // Still needed for z-index stacking
        height: '100dvh',
        maxHeight: '100dvh',
        overflow: 'hidden', // Prevents the *entire* drawer from scrolling
        // Texture is now applied globally via CSS in index.html targeting .settings-drawer-content
        '> *': { position: 'relative', zIndex: 1 },
    }}
>
    {/* Add class for texture targeting */}
    <DrawerBody
        className="settings-drawer-body" // Add class here
        p={0}
        overflowY="auto"
        display="flex"
        flexDirection="column"
        height="100%"
        position="relative" // Needed for the ::before pseudo-element
    >
        {/* Main VStack for content */}
        {/* flex={1} allows this VStack to grow and push the signature down */}
        <VStack spacing={5} align="stretch" px={sectionPaddingX} py={4} flex={1}>
            {/* New Header Area */}
            <Box>
              <Flex align="center" justify="space-between" mb={1}>
                 {/* Theme Toggle */}
                 <Tooltip
                  label={
                    isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'
                  }
                  placement="bottom"
                  bg="var(--bg)"
                  color="var(--text)"
                >
                  <IconButton
                    aria-label={
                      isDark ? 'Switch to light theme' : 'Switch to dark theme'
                    }
                    icon={
                      isDark ? (
                        <IoSunnyOutline size="20px" color="var(--text)" />
                      ) : (
                        <IoMoonOutline size="20px" color="var(--text)" />
                      )
                    }
                    variant="ghost"
                    onClick={toggleTheme}
                    _hover={{ bg: 'rgba(0, 0, 0, 0.1)' }}
                    borderRadius="md"
                    size="sm"
                  />
                </Tooltip>

                {/* Cognito Title */}
              <Link href="https://github.com/3-ark/Cognito" isExternal>
                <Heading
                  as="h3"
                  size="md"
                  fontWeight="semibold"
                  color="var(--text)"
                  bg="var(--active)"
                  fontFamily="'Orbitron', sans-serif"
                  letterSpacing="tight"
                  display="inline-block"
                  px={3}
                  py={1}
                  borderRadius="md"
                  mx="auto"
                >
                  COGNITO <Box as="sub" fontStyle='italic' sx={{filter: 'contrast(200%)', fontSize: '0.5em'}}>v2.7</Box>
                </Heading>
              </Link>

                {/* Theme Toggle (Dark/Light) */}

                {/* Close Button */}
                <Tooltip
                  label="Close Settings"
                  placement="bottom"
                  bg="var(--bg)"
                  color="var(--text)"
                >
                  <IconButton
                    aria-label="Close Drawer"
                    icon={<FiX size="24px" color="var(--text)" />}
                    variant="ghost"
                    onClick={onClose}
                    _hover={{ bg: 'rgba(0, 0, 0, 0.1)' }}
                    borderRadius="md"
                    size="sm"
                  />
                </Tooltip>
              </Flex>
              <Text
                fontSize="3xl"
                fontWeight="bold"
                color="var(--text)"
                lineHeight="1.1"
                textAlign="center"
                mt={2}
              >
                Settings
              </Text>
            </Box>

            {/* Persona Section */}
            <Box>
              <Text
                color="var(--text)"
                opacity={0.8}
                fontSize="lg"
                fontWeight="medium"
                mb={2}
                textTransform="uppercase"
              >
                Persona
              </Text>
              <Select
                size={controlSize}
                value={config?.persona || ''}
                onChange={(e) => updateConfig({ persona: e.target.value })}
                bg={controlBg}
                borderColor={subtleBorderColor}
                borderWidth="1px"
                h="36px"
                color="var(--text)"
                borderRadius="xl" // Make rounder
                boxShadow={floatingShadow} // Keep shadow
                filter={controlFilter} // *** ADDED Filter ***
                _hover={{
                  borderColor: 'var(--active)',
                  filter: `${controlFilter} brightness(0.98)`, // Combine filters
                }}
                _focus={{
                  borderColor: 'var(--active)',
                  boxShadow: `0 0 0 1px var(--active), ${floatingShadow}`,
                  bg: controlBg, // Keep control background on focus
                  filter: controlFilter, // Keep filter on focus
                }}
                sx={{
                  '> option': {
                    background: 'var(--bg)', // Options use main background
                    color: 'var(--text)',
                  },
                  '> option:hover': { filter: 'brightness(0.95)' },
                }}
              >
                {Object.keys(config?.personas || {}).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Box>

            {/* Model Section */}
            <Box>
              <Text
                color="var(--text)"
                opacity={0.8}
                fontSize="lg"
                fontWeight="medium"
                mb={2}
                textTransform="uppercase"
              >
                Model
              </Text>
              <Box position="relative">
                <Input
                  size={controlSize}
                  value={inputFocused ? searchQuery : config?.selectedModel || ''}
                  placeholder={
                    inputFocused
                      ? 'Search models...'
                      : config?.selectedModel || 'Select model...'
                  }
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    setSearchQuery('');
                    setInputFocused(true);
                    fetchAllModels();
                  }}
                  onBlur={() => setTimeout(() => setInputFocused(false), 200)}
                  bg={controlBg} // *** UPDATED Background ***
                  h="36px" // Make shorter
                  borderColor={subtleBorderColor}
                  borderWidth="1px"
                  color="var(--text)"
                  borderRadius="xl" // Make rounder
                  boxShadow={floatingShadow} // Keep shadow
                  filter={controlFilter} // *** ADDED Filter ***
                  _hover={{ // Keep hover/focus styles
                    borderColor: 'var(--active)',
                    filter: `${controlFilter} brightness(0.98)`, // Combine filters
                  }}
                  _focus={{
                    borderColor: 'var(--active)',
                    boxShadow: `0 0 0 1px var(--active), ${floatingShadow}`,
                    bg: controlBg, // Keep control background on focus
                    filter: controlFilter, // Keep filter on focus
                  }}
                />
                {/* Model Dropdown List (uses main bg for consistency) */}
                {inputFocused && (
                  <Box
                    position="absolute"
                    width="100%"
                    mt={1}
                    maxH="200px"
                    overflowY="auto"
                    bg="var(--bg)" // Keep dropdown list background standard
                    borderWidth="1px"
                    borderColor="var(--text)"
                    borderRadius="md"
                    boxShadow="md"
                    zIndex={1} // Ensure dropdown is above texture pseudo-element
                  >
                    {filteredModels.length > 0 ? (
                      filteredModels.map((model) => (
                        <Box
                          key={model.id}
                          p={3}
                          cursor="pointer"
                          color="var(--text)"
                          _hover={{ bg: 'var(--active)' }}
                          onMouseDown={() => {
                            updateConfig({ selectedModel: model.id });
                            setSearchQuery('');
                            setInputFocused(false);
                          }}
                          fontSize="sm"
                        >
                          {model.host ? `(${model.host}) ${model.id}` : model.id}
                          {model.context_length ? (
                            <Text
                              as="span"
                              fontSize="xs"
                              color="var(--text)"
                              opacity={0.6}
                              ml={2}
                            >
                              [ctx: {model.context_length}]
                            </Text>
                          ) : (
                            ''
                          )}
                        </Box>
                      ))
                    ) : (
                      <Box p={3} color="var(--text)" opacity={0.6} fontSize="sm">
                        No models found
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Action Links Section (Config & History) */}
            <VStack spacing={3} align="stretch">
              <Button
                size={controlSize}
                onClick={() => {
                  setSettingsMode(true);
                  onClose();
                }}
                variant="outline"
                h="36px" // Make shorter
                borderColor={subtleBorderColor}
                color="var(--text)"
                bg={controlBg} // *** UPDATED Background ***
                boxShadow={floatingShadow}
                filter={controlFilter} // *** ADDED Filter ***
                _hover={{
                  borderColor: 'var(--active)',
                  bg: controlBg, // Keep control background on hover
                  filter: `${controlFilter} brightness(0.98)`, // Combine filters
                }}
                _active={{
                  bg: 'var(--active)', // Use active color for click feedback
                  filter: 'brightness(0.95)', // Standard active filter
                }}
                justifyContent="flex-start"
                fontWeight="medium"
                w="full"
                borderRadius="xl" // Make rounder
                // px={buttonPaddingX} // Removed, height controls padding better
              >
                Configuration
              </Button>
              <Button
                size={controlSize}
                onClick={() => {
                  setHistoryMode(true);
                  onClose();
                }}
                variant="outline"
                h="36px" // Make shorter
                borderColor={subtleBorderColor}
                color="var(--text)"
                bg={controlBg} // *** UPDATED Background ***
                boxShadow={floatingShadow}
                filter={controlFilter} // *** ADDED Filter ***
                _hover={{
                  borderColor: 'var(--active)',
                  bg: controlBg, // Keep control background on hover
                  filter: `${controlFilter} brightness(0.98)`, // Combine filters
                }}
                _active={{
                  bg: 'var(--active)', // Use active color for click feedback
                  filter: 'brightness(0.95)', // Standard active filter
                 }}
                justifyContent="flex-start"
                fontWeight="medium"
                w="full"
                borderRadius="xl" // Make rounder
                // px={buttonPaddingX} // Removed, height controls padding better
              >
                Chat History
              </Button>
            </VStack>

            {/* Export Section */}
            <VStack spacing={3} align="stretch">
              <Text color="var(--text)" opacity={0.8} fontSize="lg" fontWeight="medium" mb={-1} textTransform="uppercase">
              Export Now
              </Text>
              {[
                { label: "Text", action: () => { onClose(); downloadText(); } },
                { label: "JSON", action: () => { onClose(); downloadJson(); } },
                { label: "Image", action: () => { downloadImage(); onClose(); } },
              ].map(item => (
                <Button
                  size={controlSize}
                  key={item.label}
                  onClick={item.action}
                  variant="outline"
                  h="36px" // Make shorter
                  borderColor={subtleBorderColor}
                  color="var(--text)"
                  bg={controlBg} // *** UPDATED Background ***
                  boxShadow={floatingShadow}
                  filter={controlFilter} // *** ADDED Filter ***
                  _hover={{
                    borderColor: 'var(--active)',
                    bg: controlBg, // Keep control background on hover
                    filter: `${controlFilter} brightness(0.98)`, // Combine filters
                  }}
                  _active={{
                    bg: 'var(--active)', // Use active color for click feedback
                    filter: 'brightness(0.95)', // Standard active filter
                  }}
                  justifyContent="flex-start" fontWeight="medium" w="full" borderRadius="xl" // Make rounder
                  // px={buttonPaddingX} // Removed, height controls padding better
                >
                  {item.label}
                </Button>
              ))}
            </VStack>

            {/* Signature - Pushed towards bottom */}
            <Box
                mt="auto" // Pushes to bottom within the VStack
                textAlign="center"
                color="var(--text)" opacity={0.7} fontSize="xs" fontWeight="normal"
            >
                Made with ❤️ by @3-Arc
            </Box>
        </VStack>
    </DrawerBody>
</DrawerContent>
    </Drawer>
  );
};


// --- Header Component (Main Export) - No changes needed here ---
export const Header = ({
  chatTitle,
  settingsMode,
  setSettingsMode,
  historyMode,
  setHistoryMode,
  deleteAll,
  reset,
  downloadImage,
  downloadJson,
  downloadText,
}) => {
  const { config, updateConfig } = useConfig();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const availableModelNames = config?.models?.map(({ id }) => id);

  const visibleTitle = chatTitle && !settingsMode && !historyMode;

  return (
    <Box
      bg="var(--active)"
      p={0}
      borderBottomWidth="1px"
      borderColor="var(--text)"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
        h="auto"
        pb={0}
        pt={0.5}
        px={5} // Add some horizontal padding to the main header
      >
        {/* Left Button don't modify the delay, don't modify the delay*/}
        <Tooltip label={settingsMode || historyMode ? "Back to Chat" : "Open Settings"} placement="bottom" bg="var(--bg)" color="var(--text)" openDelay={1000000} closeDelay={1000000}>
          <IconButton
            aria-label={settingsMode || historyMode ? "Close" : "Settings"}
            icon={settingsMode || historyMode ? <FiX size="20px" color="var(--text)" /> : <FiSettings size="20px" color="var(--text)" />}
            variant="ghost"
            _hover={{ bg: "rgba(0, 0, 0, 0.1)" }}
            borderRadius="md"
            size="sm"
            // Removed ml/mr, rely on main Flex padding and center Flex margin
            onClick={() => {
              if (settingsMode || historyMode) {
                setSettingsMode(false);
                setHistoryMode(false);
              } else {
                onOpen();
              }
            }}
          />
        </Tooltip>

        {/* Center Section (Title/Mode Display) */}
        <Flex
          flexGrow={1} // Takes up available space
          justifyContent="center" // Centers its content
          alignItems="center"
          overflow="hidden" // Prevents content from overflowing
          mx={3} // Add some margin to space it from buttons
        >
          {/* --- Moved Content Inside --- */}
          {visibleTitle && (
            <Text
              fontSize="md"
              fontWeight="semibold"
              color="var(--text)"
              fontStyle="italic"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              textAlign="center" // Explicitly center text just in case
            >
              {chatTitle}
            </Text>
          )}
          {!visibleTitle && !historyMode && !settingsMode && (
            <Badge>
              {config?.persona || 'Default'} @ {config?.selectedModel || 'None'}
            </Badge>
          )}
          {settingsMode && (
            // Keep this Flex simple, centering is handled by the parent
            <Flex align="center" justify="center" width="auto">
              <Text fontSize="md" fontFamily="Allura" fontWeight="semibold" color="var(--text)" fontStyle="normal" whiteSpace="nowrap">
                The game is afoot{' '}
                <Box
                  as={WiMoonWaxingCrescent1}
                  display="inline-block"
                  verticalAlign="middle"
                  color="#f5eee4"
                  fontSize="20px"
                  ml={2} // Add some space before the icon
                />
              </Text>
            </Flex>
          )}
          {historyMode && (
            // Keep this Flex simple, centering is handled by the parent
            <Flex align="center" justify="center" width="auto">
              <Text fontFamily="Bruno Ace SC" fontSize="md" fontWeight="semibold" color="var(--text)" fontStyle="normal" whiteSpace="nowrap">
                Chat History
              </Text>
              {/* Moved delete button to the right section for consistency */}
            </Flex>
          )}
          {/* --- End Moved Content --- */}
        </Flex>

        {/* Right Button(s) */}
        <Box minWidth="30px"> {/* Add a Box to reserve space even if button isn't shown */}
          {!settingsMode && !historyMode && (
            <Tooltip label="Reset Chat" placement="bottom" bg="var(--bg)" color="var(--text)">
              <IconButton
                aria-label="Reset"
                icon={<FiTrash2 size="18px" color="var(--text)" />}
                variant="ghost"
                _hover={{ bg: "rgba(0, 0, 0, 0.1)" }}
                borderRadius="md"
                size="sm"
                onClick={reset}
                // Removed mr, rely on main Flex padding
              />
            </Tooltip>
          )}
          {historyMode && ( // Show delete all only in history mode here
             <Tooltip label="Delete All History" placement="bottom" bg="var(--bg)" color="var(--text)">
                <IconButton
                  aria-label="Delete all"
                  icon={<FiTrash2 size="18px" color="var(--text)" />}
                  variant="ghost"
                  _hover={{ bg: "rgba(255, 0, 0, 0.1)" }}
                  borderRadius="md"
                  size="sm"
                  onClick={deleteAll}
                />
              </Tooltip>
          )}
        </Box>


      </Flex>

      {/* Welcome Modal */}
      {(!config?.models || config?.models.length === 0) && !settingsMode && !historyMode && (
        <WelcomeModal isOpen={true} setSettingsMode={setSettingsMode} onClose={() => {}} />
      )}

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isOpen}
        onClose={onClose}
        config={config}
        updateConfig={updateConfig}
        availableModelNames={availableModelNames}
        setSettingsMode={setSettingsMode}
        setHistoryMode={setHistoryMode}
        downloadText={downloadText}
        downloadJson={downloadJson}
        downloadImage={downloadImage}
      />
    </Box>
  );
};
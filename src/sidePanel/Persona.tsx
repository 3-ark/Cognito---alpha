import {
 ForwardedRef, forwardRef, useEffect, useState
} from 'react';
import ResizeTextarea from 'react-textarea-autosize';
import {
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Textarea,
  useDisclosure
} from '@chakra-ui/react';
// Import icons from react-icons
import { IoAdd, IoTrashOutline } from 'react-icons/io5'; // Example using Ionicons 5

import { useConfig } from './ConfigContext';
import { SettingTitle } from './SettingsTitle';

// --- AutoResizeTextarea component remains the same ---
const AutoResizeTextarea = forwardRef((props, ref) => (
  <Textarea
    ref={ref as ForwardedRef<HTMLTextAreaElement>}
    as={ResizeTextarea}
    maxRows={8}
    minH="unset"
    minRows={3}
    overflow="scroll"
    resize="none"
    w="100%"
    {...props}
  />
));
AutoResizeTextarea.displayName = 'AutoResizeTextarea';

// --- SaveButtons component remains the same ---
import PropTypes from 'prop-types';

const SaveButtons = ({
 hasChange, buttonColor, onSave, onSaveAs, onCancel
}) => {
  const commonButtonStyles = {
    _hover: { background: 'var(--active)', border: `2px solid ${buttonColor}` },
    background: 'var(--active)',
    border: `2px solid ${buttonColor}`,
    borderRadius: 16,
    color: buttonColor,
    size: 'sm',
    mr: 2
  };

  return (
    <Box display="flex" mt={2}>
      {hasChange && (
        <>
          <Button {...commonButtonStyles} disabled={!hasChange} onClick={onSave}>
            save
          </Button>
          <Button {...commonButtonStyles} disabled={!hasChange} onClick={onSaveAs}>
            save as..
          </Button>
          <Button
            _hover={{ background: 'var(--active)', border: '2px solid var(--text)' }}
            background="var(--bg)"
            border="2px solid var(--text)"
            borderRadius={16}
            color="var(--text)"
            mr={2}
            size="sm"
            onClick={onCancel}
          >
            cancel
          </Button>
        </>
      )}
    </Box>
  );
};

// --- PersonaModal component remains the same ---
const PersonaModal = ({
 isOpen, onClose, personaPrompt, personas, updateConfig
}) => {
  const [name, setName] = useState('');
  const buttonColor = name ? 'var(--text)' : 'gray';

  const handleCreate = () => {
    if (!name) return;

    updateConfig({
      personas: { ...personas, [name]: personaPrompt },
      persona: name
    });

    setName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="xs" isCentered onClose={onClose}>
      <ModalOverlay />
      <ModalContent background="var(--active)" borderRadius={16}>
        <ModalHeader color="var(--text)" padding={2} paddingLeft={6}>
          Create New Persona
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody padding={4}>
          <Input
            _focus={{ borderColor: 'var(--text)', boxShadow: 'none !important' }}
            _hover={{ borderColor: 'var(--text)', boxShadow: 'none !important' }}
            background="var(--bg)"
            border="2px"
            borderColor="var(--text)"
            borderRadius={16}
            color="var(--text)"
            fontSize="md"
            fontStyle="bold"
            fontWeight={600}
            mr={4}
            placeholder="name"
            size="md"
            value={name}
            variant="outline"
            onChange={e => setName(e.target.value)}
          />
        </ModalBody>
        <ModalFooter justifyContent="center" pt={0}>
          <Button
            _hover={{ background: 'var(--bg)', border: `2px solid ${buttonColor}` }}
            background="var(--bg)"
            border={`2px solid ${buttonColor}`}
            borderRadius={16}
            color={buttonColor}
            disabled={!name}
            mr={2}
            size="sm"
            onClick={handleCreate}
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// --- DeleteModal component remains the same ---
const DeleteModal = ({
 isOpen, onClose, persona, personas, updateConfig
}) => {
  const handleDelete = () => {
    const newPersonas = { ...personas };

    delete newPersonas[persona];
    updateConfig({
      personas: newPersonas,
      persona: Object.keys(newPersonas)[0] || 'Ein' // Ensure a fallback persona exists
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} size="xs" isCentered onClose={onClose}>
      <ModalOverlay />
      <ModalContent background="var(--active)" borderRadius={16}>
        <ModalHeader padding={2} paddingLeft={6}>
          Delete
          {' '}
          {persona}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody padding={2} />
        <ModalFooter justifyContent="center" pt={0}>
          <Button
            _hover={{ background: 'var(--bg)', border: '2px solid var(--text)' }}
            background="var(--bg)"
            border="2px solid var(--text)"
            borderRadius={16}
            color="var(--text)"
            mr={2}
            size="sm"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// --- PersonaSelect component remains the same ---
const PersonaSelect = ({
 personas, persona, updateConfig
}) => (
  <Select
    _focus={{ borderColor: 'var(--text)', boxShadow: 'none !important' }}
    _hover={{ borderColor: 'var(--text)', boxShadow: 'none !important' }}
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
    defaultValue="default"
    fontSize="md"
    fontStyle="bold"
    fontWeight={600}
    maxWidth="50%"
    mb={2}
    ml={1}
    size="sm"
    value={persona}
    onChange={e => updateConfig({ persona: e.target.value })}
  >
    {Object.keys(personas).map(p => (
      <option key={p} value={p}>{p}</option>
    ))}
  </Select>
);

// --- PersonaTextarea component remains the same ---
const PersonaTextarea = ({ personaPrompt, setPersonaPrompt }) => (
  <AutoResizeTextarea

    // @ts-expect-error Props are spread to the underlying Textarea component.

    _focus={{ borderColor: 'var(--text)', boxShadow: 'none !important' }}
    _hover={{ borderColor: 'var(--text)', boxShadow: 'none !important' }}
    background="var(--text)"
    border="2px"
    borderColor="var(--text)"
    borderRadius={16}
    boxShadow="none !important"
    color="var(--bg)"
    fontSize="md"
    fontStyle="bold"
    fontWeight={600}
    value={personaPrompt}
    onChange={e => setPersonaPrompt(e.target.value)}
  />
);

// --- SaveButtonsWrapper component remains the same ---
const SaveButtonsWrapper = ({
 buttonColor, hasChange, defaultPrompt, setPersonaPrompt, updateConfig, personas, persona, onOpen, personaPrompt
}) => (
  <SaveButtons
    buttonColor={buttonColor}
    hasChange={hasChange}
    onCancel={() => setPersonaPrompt(defaultPrompt)}
    onSave={() => updateConfig({ personas: { ...personas, [persona]: personaPrompt } })}
    onSaveAs={onOpen}
  />
);

// --- PersonaModalWrapper component remains the same ---
const PersonaModalWrapper = ({
 isOpen, personaPrompt, personas, updateConfig, onClose
}) => (
  <PersonaModal
    isOpen={isOpen}
    personaPrompt={personaPrompt}
    personas={personas}
    updateConfig={updateConfig}
    onClose={onClose}
  />
);

// --- DeleteModalWrapper component remains the same ---
const DeleteModalWrapper = ({
 isDeleteOpen, persona, personas, updateConfig, onDeleteClose
}) => (
  <DeleteModal
    isOpen={isDeleteOpen}
    persona={persona}
    personas={personas}
    updateConfig={updateConfig}
    onClose={onDeleteClose}
  />
);

// --- Persona component (Main changes here) ---
const Persona = () => {
  const {
 isOpen, onOpen, onClose
} = useDisclosure();
  const {
 isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose
} = useDisclosure();
  // const [name, setName] = useState('');
  const { config, updateConfig } = useConfig();
  const personas = config?.personas || {};
  const persona = config?.persona || 'Ein'; // Ensure a default persona exists

  // Ensure defaultPrompt has a fallback if the selected persona doesn't exist or personas is empty
  const defaultPrompt = personas?.[persona] || personas?.Ein || '';
  const [personaPrompt, setPersonaPrompt] = useState(defaultPrompt);
  const hasChange = personaPrompt !== defaultPrompt;

  useEffect(() => {
    if (defaultPrompt !== personaPrompt) {
      setPersonaPrompt(defaultPrompt);
    }
  }, [defaultPrompt]);

  const buttonColor = hasChange ? 'var(--text)' : 'gray';

  return (
    <AccordionItem
      border="2px solid var(--text)"
      borderBottomWidth="2px !important"
      borderRadius={16}
      mb={4}
    >
      <AccordionButton _hover={{ backgroundColor: 'transparent' }} paddingBottom={1} paddingRight={2}>
        <SettingTitle
          icon="👤"
          padding={0}
          text="Persona"
        />
      </AccordionButton>
      <AccordionPanel p={2} pt={2}>
        <Box display="flex" flexWrap="wrap" alignItems="center"> {/* Added alignItems */}
          <PersonaSelect persona={persona} personas={personas} updateConfig={updateConfig} />
          {Object.keys(personas).length > 1 && (
            <IconButton
              aria-label="delete persona" // More descriptive aria-label
              borderRadius={16}
              // Use react-icons component here
              icon={<IoTrashOutline />}
              pb={2} 
              variant="ghost" // Use ghost or unstyled for better control with react-icons
              size="lg" // Adjust size as needed
              ml={2} // Add some margin
              onClick={onDeleteOpen}
            />
          )}
          <IconButton
            aria-label="add new persona" // More descriptive aria-label
            borderRadius={16}
            // Use react-icons component here
            icon={<IoAdd />}
            pb={2} // Align with other buttons
            variant="ghost" // Use ghost or unstyled
            size="lg" // Adjust size as needed
            ml={2} // Add some margin
            onClick={() => {
              // Reset prompt for new persona creation
              setPersonaPrompt('');
              onOpen();
            }}
          />
          <PersonaTextarea personaPrompt={personaPrompt} setPersonaPrompt={setPersonaPrompt} />
          <SaveButtonsWrapper
            buttonColor={buttonColor}
            defaultPrompt={defaultPrompt}
            hasChange={hasChange}
            persona={persona}
            personaPrompt={personaPrompt}
            personas={personas}
            setPersonaPrompt={setPersonaPrompt}
            updateConfig={updateConfig}
            onOpen={onOpen} // Pass onOpen for 'save as' functionality
          />
        </Box>
      </AccordionPanel>
      {/* Modals remain the same but ensure they receive correct props */}
      <PersonaModalWrapper
        isOpen={isOpen}
        // Pass the current (potentially empty) prompt for the new persona
        personaPrompt={personaPrompt}
        personas={personas}
        updateConfig={updateConfig}
        onClose={() => {
            // Reset prompt back to the selected persona's default if modal is closed without saving
            setPersonaPrompt(defaultPrompt);
            onClose();
        }}
      />
      <DeleteModalWrapper
        isDeleteOpen={isDeleteOpen}
        persona={persona} // Pass the currently selected persona to delete
        personas={personas}
        updateConfig={updateConfig}
        onDeleteClose={onDeleteClose}
      />
    </AccordionItem>
  );
};

// --- PropTypes remain the same ---
SaveButtons.propTypes = {
  hasChange: PropTypes.bool.isRequired,
  buttonColor: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  onSaveAs: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export { AutoResizeTextarea, Persona };


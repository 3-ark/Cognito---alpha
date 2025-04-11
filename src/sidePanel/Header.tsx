/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/prop-types */
import React from 'react';
import {
  DeleteIcon,
  SettingsIcon,
  SmallCloseIcon
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  IconButton,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Select,
  Text,
  useDisclosure
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useConfig } from './ConfigContext';
import { Docs } from './Docs';

// eslint-disable-next-line react/prop-types
const WelcomeModal = ({ isOpen, onClose, setSettingsMode }) => (
  <Modal isCentered isOpen={isOpen} scrollBehavior="inside" size="sm" onClose={onClose}>
    <ModalOverlay />
    <ModalContent bg="var(--bg)" border="2px solid var(--text)" borderRadius={16} color="var(--text)" pb={2}>
      <ModalHeader textAlign="center">👋 welcome to Bruside 👋</ModalHeader>
      <ModalBody>
        <Text color="var(--text)" fontSize="md" fontWeight={600} textAlign="center">
          you have no active connection
        </Text>
        <Box display="flex" justifyContent="center" mt={6}>
          <Button
            _hover={{ background: 'var(--active)', border: '2px solid var(--text)' }}
            background="var(--active)"
            border="2px solid var(--text)"
            borderRadius={16}
            color="var(--text)"
            leftIcon={<SettingsIcon />}
            mr={2}
            size="md"
            position="relative"
            sx={{
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'url(assets/images/paper-texture.png)',
                backgroundSize: 'auto',
                opacity: 0.8,
                pointerEvents: 'none',
                borderRadius: '16px',
                mixBlendMode: 'multiply',
                zIndex: 0
              }
            }}
            onClick={() => setSettingsMode(true)}
          >
            settings
          </Button>
        </Box>
      </ModalBody>
    </ModalContent>
  </Modal>
);

// eslint-disable-next-line react/prop-types
const Badge = ({ children }) => (
  <Box
    background="var(--bg)"
    border="2px"
    borderColor="var(--text)"
    borderRadius={16}
    color="var(--text)"
    defaultValue="default"
    fontSize="md"
    fontStyle="bold"
    fontWeight={600}
    overflow="hidden"
    pb={0.5}
    pl={3}
    pr={3}
    pt={0.5}
    textOverflow="ellipsis"
    whiteSpace="nowrap"
  >
    {children}
  </Box>
);

// eslint-disable-next-line react/prop-types
const DrawerHeader = ({ onClose }) => (
  <Box alignItems="center" background="var(--active)" borderBottom="2px solid var(--text)" display="flex" paddingBottom={2} paddingTop={2}>
    <IconButton
      aria-label="Close Drawer"
      as={motion.div}
      borderRadius={16}
      icon={<SmallCloseIcon color="var(--text)" fontSize="3xl" />}
      ml={1}
      mr={1}
      variant="outlined"
      position="relative"
      sx={{
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(assets/images/paper-texture.png)',
          backgroundSize: 'cover',
          opacity: 0.0,
          pointerEvents: 'none',
          borderRadius: '16px',
          mixBlendMode: 'multiply',
          zIndex: 0
        }
      }}
      whileHover={{ cursor: 'pointer' }}
      onClick={onClose}
    />
    <Badge>settings</Badge>
  </Box>
);

// eslint-disable-next-line react/prop-types
const DrawerSection = ({ title, children }) => (
  <Box borderBottom="2px solid var(--text)" p={2} pb={4}>
    <Text color="var(--text)" fontSize="xl" fontWeight={600} mb={2}>{title}</Text>
    {children}
  </Box>
);

// eslint-disable-next-line react/prop-types
const DrawerLinkSection = ({ title, onClick }) => (
  <Box _hover={{ background: 'var(--active)' }} borderBottom="2px solid var(--text)">
    <Text
      color="var(--text)"
      cursor="pointer"
      fontSize="xl"
      fontWeight={600}
      p={2}
      onClick={onClick}
    >
      {title}
    </Text>
  </Box>
);

// eslint-disable-next-line react/prop-types
const SettingsDrawer = ({ isOpen, onClose, config, updateConfig, availableModelNames, setSettingsMode, downloadText, downloadJson, downloadImage, setHistoryMode }) => (
  <Drawer isOpen={isOpen} placement="left" size="xs" onClose={onClose}>
    <DrawerOverlay />
    <DrawerContent 
      background="var(--bg)" 
      borderRadius={8} 
      borderRight="2px solid var(--text)"
      sx={{
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(assets/images/paper-texture.png)',
          backgroundSize: '512px',
          opacity: 0.5,
          pointerEvents: 'none',
          mixBlendMode: 'multiply',
          zIndex: 0
        }
      }}
    >
      <DrawerBody padding={0}>
        <DrawerHeader onClose={onClose} />
        <DrawerSection title="persona">
          <Select
            _focus={{ borderColor: 'var(--text)', boxShadow: 'none !important', background: 'transparent' }}
            _hover={{ borderColor: 'var(--text)', boxShadow: 'none !important', background: 'var(--active)' }}
            background="transparent"
            border="2px"
            borderColor="var(--text)"
            borderRadius={16}
            color="var(--text)"
            defaultValue="default"
            fontSize="md"
            fontWeight={600}
            overflow="hidden"
            size="sm"
            value={config?.persona}
            whiteSpace="nowrap"
            onChange={e => updateConfig({ persona: e.target.value })}
          >
            {Object.keys(config.personas || {}).map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </DrawerSection>
        <DrawerSection title="model">
          <Select
            _focus={{ borderColor: 'var(--text)', boxShadow: 'none !important', background: 'transparent' }}
            _hover={{ borderColor: 'var(--text)', boxShadow: 'none !important', background: 'var(--active)' }}
            background="transparent"
            border="2px"
            borderColor="var(--text)"
            borderRadius={16}
            color="var(--text)"
            defaultValue="default"
            fontSize="md"
            fontWeight={600}
            overflow="hidden"
            size="sm"
            value={config?.selectedModel || ''}
            whiteSpace="nowrap"
            onChange={e => updateConfig({ selectedModel: e.target.value })}
          >
            {!config?.models?.length ? (
              <option disabled value="default">loading models...</option>
            ) : (
              config.models.map((model: any) => (
                <option 
                  key={model.id} 
                  disabled={model.active === false}
                  value={model.id}
                >
                  {model.host ? `(${model.host}) ${model.id}` : model.id}
                </option>
              ))
            )}
          </Select>
        </DrawerSection>
        <DrawerLinkSection title="configuration" onClick={() => { setSettingsMode(true); onClose(); }} />
        <DrawerLinkSection
          title="chat history"
          onClick={() => { setHistoryMode(true); onClose(); }}
        />
        <DrawerLinkSection
          title="export chat (text)"
          onClick={() => { onClose(); downloadText(); }}
        />
        <DrawerLinkSection
          title="export chat (json)"
          onClick={() => { onClose(); downloadJson(); }}
        />
        <DrawerLinkSection
          title="export chat (image)"
          onClick={() => { downloadImage(); onClose(); }}
        />
      </DrawerBody>
    </DrawerContent>
  </Drawer>
);

export const Header = ({ ...props }) => {
  const { config, updateConfig } = useConfig();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const availableModelNames = config?.models?.map(({ id }) => id);

  const visibleTitle = props.chatTitle && !props.settingsMode && !props.historyMode;

  return (
    <Box
      background="var(--active)"
      pb={0}
      pt={2}
      textAlign="left"
      zIndex={3}
      sx={{
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(assets/images/paper-texture.png)',
          backgroundSize: 'auto',
          opacity: 0.3,
          pointerEvents: 'none',
          mixBlendMode: 'multiply'
        }
      }}
    >
      <Box
        alignItems="center"
        borderBottom="2px solid var(--text)"
        display="flex"
        justifyContent="space-between"
        pb={2}
      >
        {(!config?.models || config?.models.length === 0) && !props.settingsMode && (
          <WelcomeModal isOpen={!props.settingsMode} setSettingsMode={props.setSettingsMode} onClose={() => {}} />
        )}
        <Box alignItems="center" display="flex" flexGrow={1} overflow="hidden" width="80%">
          <Box style={{ cursor: 'pointer' }}>
            {!props.settingsMode && !props.historyMode ? (
              <IconButton
                aria-label="Settings"
                as={motion.div}
                borderRadius={16}
                icon={<SettingsIcon color="var(--text)" fontSize="xl" />}
                ml={1}
                mr={1}
                variant="outlined"
                whileHover={{ rotate: '90deg', cursor: 'pointer' }}
                onClick={onOpen}
              />
            ) : (
              <IconButton
                aria-label="Close"
                as={motion.div}
                borderRadius={16}
                icon={<SmallCloseIcon color="var(--text)" fontSize="3xl" />}
                ml={1}
                mr={1}
                variant="outlined"
                whileHover={{ cursor: 'pointer' }}
                onClick={() => {
                  props.setSettingsMode(false);
                  props.setHistoryMode(false);
                }}
              />
            )}
          </Box>
          {visibleTitle && <Badge>{props.chatTitle}</Badge>}
          {!visibleTitle && !props.historyMode && !props.settingsMode && (
          <Badge>
            {' '}
            {config?.persona || ''}
            {' '}
            @
            {' '}
            {config?.selectedModel || ''}
          </Badge>
          )}
          {!props.historyMode && props.settingsMode && (
            <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
              <Text
                color="var(--text)"
                fontSize="md"
                fontWeight={600}
              >
                The Game is Afoot!
              </Text>
              <Docs />
            </Box>
          )}
          {props.historyMode && (
            <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
              <Badge>chat history</Badge>
              <IconButton
                aria-label="Delete all"
                as={motion.div}
                borderRadius={16}
                icon={<DeleteIcon color="var(--text)" fontSize="xl" />}
                variant="outlined"
                whileHover={{ rotate: '15deg', cursor: 'pointer' }}
                onClick={props.deleteAll}
                mr={2}
              />
            </Box>
          )}
        </Box>
        {!props.settingsMode && !props.historyMode && (
          <IconButton
            aria-label="Reset"
            as={motion.div}
            borderRadius={16}
            icon={<DeleteIcon color="var(--text)" fontSize="xl" />}
            variant="outlined"
            whileHover={{ rotate: '15deg', cursor: 'pointer' }}
            onClick={props.reset}
          />
        )}
      </Box>
      <SettingsDrawer
        availableModelNames={availableModelNames}
        config={config}
        downloadImage={props.downloadImage}
        downloadJson={props.downloadJson}
        downloadText={props.downloadText}
        isOpen={isOpen}
        setHistoryMode={props.setHistoryMode}
        setSettingsMode={props.setSettingsMode}
        updateConfig={updateConfig}
        onClose={onClose}
      />
    </Box>
  );
};

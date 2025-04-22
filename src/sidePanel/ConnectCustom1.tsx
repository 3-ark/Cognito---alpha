import { useState } from 'react';
import toast from 'react-hot-toast';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import {
  Box, Button, IconButton, Input
} from '@chakra-ui/react';

import { useConfig } from './ConfigContext';

export const ConnectCustom1 = () => {
  const { config, updateConfig } = useConfig();
  const [apiKey, setApiKey] = useState(config?.customApiKey || '');
  const [visibleApiKeys, setVisibleApiKeys] = useState(false);

  const onConnect = () => {
    // No endpoint check, just save the key and model
    updateConfig({
      customApiKey: apiKey,
      customConnected: true,
      customError: undefined,
      models: [
        ...(config?.models || []).filter(m => m.id !== 'custom'),
        { id: 'custom', host: 'custom', active: true }
      ],
      selectedModel: 'custom'
    });
    toast.success('Custom endpoint 1 connected');
  };

  const disabled = config?.customApiKey === apiKey;
  const isConnected = config?.customConnected;

  return (
    <Box display="flex" mb={4} ml={4} mr={4}>
      <Input
        _focus={{
          borderColor: 'var(--text)',
          boxShadow: 'none !important'
        }}
        _hover={{
          borderColor: !disabled && 'var(--text)',
          boxShadow: !disabled && 'none !important'
        }}
        autoComplete="off"
        border="2px"
        borderColor="var(--text)"
        borderRadius={16}
        color="var(--text)"
        fontSize="md"
        fontStyle="bold"
        fontWeight={600}
        id="user-input"
        mr={4}
        placeholder="CUSTOM_API_KEY"
        size="sm"
        type={!visibleApiKeys ? 'password' : undefined}
        value={apiKey}
        variant="outline"
        onChange={e => setApiKey(e.target.value)}
      />
      {!isConnected && (
        <Button
          _hover={{
            background: 'var(--active)',
            border: '2px solid var(--text)'
          }}
          background="var(--active)"
          border="2px solid var(--text)"
          borderRadius={16}
          color="var(--text)"
          disabled={disabled}
          size="sm"
          onClick={onConnect}
        >
          connect
        </Button>
      )}
      {isConnected && (
        <IconButton
          _hover={{
            background: 'var(--active)',
            border: '2px solid var(--text)'
          }}
          aria-label="Done"
          background="var(--active)"
          border="2px solid var(--text)"
          color="var(--text)"
          fontSize="19px"
          icon={visibleApiKeys ? <ViewOffIcon /> : <ViewIcon />}
          size="sm"
          variant="solid"
          isRound
          onClick={() => setVisibleApiKeys(!visibleApiKeys)}
        />
      )}
    </Box>
  );
};
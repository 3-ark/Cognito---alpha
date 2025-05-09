import { useState } from 'react';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa'; // Import React Icons
import {
  Box,
  Button,
  IconButton,
  Input,
} from '@chakra-ui/react';

import { useConfig } from './ConfigContext';

export const ConnectCustom = () => {
  const { config, updateConfig } = useConfig();
  const [apiKey, setApiKey] = useState(config?.customApiKey || '');
  const [endpoint, setEndpoint] = useState(config?.customEndpoint || '');
  const [visibleApiKeys, setVisibleApiKeys] = useState(false);

  const onConnect = async () => {
    toast.success('Custom endpoint connected');
    updateConfig({
      customApiKey: apiKey,
      customEndpoint: endpoint,
      customConnected: true,
      customError: undefined,
      models: [
        ...(config?.models || []),
        { id: 'custom', host: 'custom', active: true },
      ],
      selectedModel: 'custom',
    });
  };

  const disabled = config?.customApiKey === apiKey && config?.customEndpoint === endpoint;
  const isConnected = config?.customConnected;

  return (
    <Box display="flex" flexDirection="column" gap={2} mb={4} ml={4} mr={4}>
      <Input
        placeholder="custom_openai_endpoint"
        value={endpoint}
        onChange={e => setEndpoint(e.target.value)}
        mb={2}
        size="sm"
        border="2px"
        borderColor="var(--text)"
        borderRadius={16}
        color="var(--text)"
        fontSize="md"
        fontWeight={600}
        variant="outline"
      />
      <Box display="flex">
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
          <>
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
              icon={visibleApiKeys ? <FaEyeSlash /> : <FaEye />} // Use React Icons
              size="sm"
              variant="solid"
              isRound
              onClick={() => setVisibleApiKeys(!visibleApiKeys)}
            />
            <IconButton
              aria-label="Reset Custom Endpoint"
              icon={<FaTimes />}
              ml={2}
              borderRadius={16}
              background="var(--active)"
              border="2px solid var(--text)"
              color="var(--text)"
              size="sm"
              onClick={() => {
                setApiKey('');
                setEndpoint('');
                updateConfig({
                  customApiKey: '',
                  customEndpoint: '',
                  customConnected: false,
                  customError: undefined,
                });
              }}
            />
          </>
        )}
      </Box>
    </Box>
  );
};

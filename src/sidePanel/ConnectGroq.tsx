import { useState } from 'react';
import toast from 'react-hot-toast';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import {
 Box, Button, IconButton, Input 
} from '@chakra-ui/react';

import { useConfig } from './ConfigContext';
import { GROQ_URL } from './constants';

export const ConnectGroq = () => {
  const { config, updateConfig } = useConfig();
  const [apiKey, setApiKey] = useState(config?.groqApiKey);
  const [visibleApiKeys, setVisibleApiKeys] = useState(false);
  const onConnect = () => {
    fetch(GROQ_URL, { headers: { Authorization: `Bearer ${apiKey}` } })
      .then(res => res.json())
      .then(data => {
        if (data?.error) {
          toast.error(`${data?.error?.message}`)
          updateConfig({ groqError: data?.error?.message, groqConnected: false });
        } else {
          toast.success('connected to groq');
          updateConfig({
            groqApiKey: apiKey,
            groqConnected: true,
            groqError: undefined,
            models: [
              ...(config?.models || []),
              { id: 'groq', host: 'groq', active: true } // Add this model entry
            ],
            selectedModel: 'groq'
          });
        }
      })
      .catch(err => {
        toast.error(err.message);
      });
  };

  const disabled = config?.groqApiKey === apiKey;
  const isConnected = config?.groqConnected;

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
        placeholder="GROQ_API_KEY"
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

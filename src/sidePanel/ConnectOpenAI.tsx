import React from 'react';
import { useState } from 'react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { Box, Button, IconButton, Input } from '@chakra-ui/react';

import { useConfig } from './ConfigContext';
import { OPENAI_URL } from './constants';
import toast from 'react-hot-toast';

export const ConnectOpenAI = () => {
  const { config, updateConfig } = useConfig();
  const [apiKey, setApiKey] = useState(config?.openAiApiKey);
  const [visibleApiKeys, setVisibleApiKeys] = useState(false);
  const onConnect = () => {
    fetch(OPENAI_URL, { headers: { Authorization: `Bearer ${apiKey}` } })
      .then(res => res.json())
      .then(data => {
        if (data?.error) {
          toast.error(`${data?.error?.message}`)

          updateConfig({ openAiError: data?.error?.message, openAiConnected: false });
        } else {
          toast.success('connected to OpenAI');

          updateConfig({
            openAiApiKey: apiKey,
            openAiConnected: true,
            openAiError: undefined
          });
        }
      })
      .catch(err => {
        toast.error(err.message);
      });
  };

  const disabled = config?.openAiApiKey === apiKey;
  const isConnected = config?.openAiConnected && config?.openAiApiKey === apiKey;

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
        placeholder="OPENAI_API_KEY"
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
        isRound
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
        onClick={() => setVisibleApiKeys(!visibleApiKeys)}
      />
      )}

    </Box>
  );
};

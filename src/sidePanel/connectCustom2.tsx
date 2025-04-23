import { useState } from 'react';
import toast from 'react-hot-toast';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import {
  Box, Button, IconButton, Input
} from '@chakra-ui/react';

import { useConfig } from './ConfigContext';

export const ConnectCustom2 = () => {
  const { config, updateConfig } = useConfig();
  const [apiKey, setApiKey] = useState(config?.custom2ApiKey || '');
  const [endpoint, setEndpoint] = useState(config?.customEndpoint2 || '');
  const [visibleApiKeys, setVisibleApiKeys] = useState(false);

  const onConnect = async () => {
    try {
      // Fetch models from the custom endpoint
      const modelsRes = await fetch(
        endpoint.replace(/\/v1\/chat\/completions$/, '') + '/v1/models',
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        }
      );
      const modelsJson = await modelsRes.json();
      const models = (modelsJson.data || []).map((m: any) => ({
        ...m,
        id: m.id || m.name,
        host: 'custom2',
        active: false,
      }));

      updateConfig({
        custom2ApiKey: apiKey,
        customEndpoint2: endpoint,
        custom2Connected: true,
        custom2Error: undefined,
        models: [
          ...(config?.models || []),
          ...models,
        ],
        selectedModel: models[0]?.id || '',
      });
      toast.success('Custom endpoint 2 connected');
    } catch (e) {
      toast.error('Failed to fetch models from custom endpoint');
      updateConfig({
        custom2Error: 'Failed to fetch models',
        custom2Connected: false,
      });
    }
  };

  const disabled = config?.custom2ApiKey === apiKey && config?.customEndpoint2 === endpoint;
  const isConnected = config?.custom2Connected;

  return (
    <Box display="flex" flexDirection="column" gap={2} mb={4} ml={4} mr={4}>
      <Input
        placeholder="custom_endpoint2"
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
          placeholder="CUSTOM2_API_KEY"
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
    </Box>
  );
};

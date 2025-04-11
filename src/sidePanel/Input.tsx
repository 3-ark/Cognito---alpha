import React, { ForwardedRef, useEffect, useRef } from 'react';
import ResizeTextarea from 'react-textarea-autosize';
import { Box, Textarea } from '@chakra-ui/react';

import { useConfig } from './ConfigContext';

export const AutoResizeTextarea = React.forwardRef((props, ref) => (
  <Textarea
    as={ResizeTextarea}
    maxRows={8}
    minH="unset"
    minRows={1}
    overflow="scroll"
    ref={ref as ForwardedRef<HTMLTextAreaElement>}
    resize="none"
    w="100%"
    {...props}
  />
));
AutoResizeTextarea.displayName = 'AutoResizeTextarea';

export const Input = ({ ...props }) => {
  const { config } = useConfig();
  const ref = useRef(null);
  useEffect(() => {
    // @ts-ignore
    ref?.current?.focus();
  }, [props.message, config?.chatMode]);

  const placeholder = config?.chatMode === 'web' ? 'what to search?' : config?.chatMode === 'page' ? 'about the page..' : '';

  return (
    <Box position="relative" width="100%" ml={2}>
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        sx={{
          backgroundImage: 'url(assets/images/paper-texture.png)',
          backgroundSize: 'auto',
          opacity: 0.3,
          pointerEvents: 'none',
          borderRadius: '14px',
          mixBlendMode: 'multiply',
          zIndex: 100,
          margin: '0 auto'
        }}
      />
      <AutoResizeTextarea
        {...props}
        autoFocus
        _focus={{
          borderColor: 'var(--text)',
          boxShadow: 'none !important'
        }}
        _hover={{
          borderColor: 'var(--text)',
          boxShadow: 'none !important'
        }}
        autoComplete="off"
        background="var(--bg)"
        border="2px"
        borderColor="var(--text)"
        borderRadius={16}
        color="var(--text)"
        fontSize="md"
        fontStyle="bold"
        fontWeight={600}
        id="user-input"
        placeholder={placeholder}
        pr={12}
        ref={ref}
        size="sm"
        position="relative"
        zIndex={1}
        width="100%"
        value={props.message}
        onChange={event => props.setMessage(event.target.value)}
        onKeyDown={event => {
          if (props.isLoading) return;
          if (event.keyCode === 13 && props.message && !event.altKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            event.stopPropagation();
            props.onSend();
            props.setMessage('');
          }
        }}
      />
    </Box>
  );
};

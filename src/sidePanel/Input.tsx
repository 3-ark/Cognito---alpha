import React, {
 ForwardedRef, useEffect, useRef 
} from 'react';
import ResizeTextarea from 'react-textarea-autosize';
import { Box, Textarea } from '@chakra-ui/react';

import { useConfig } from './ConfigContext';

export const AutoResizeTextarea = React.forwardRef((props, ref) => (
  <Textarea
    ref={ref as ForwardedRef<HTMLTextAreaElement>}
    as={ResizeTextarea}
    maxRows={8}
    minH="unset"
    minRows={1}
    overflow="scroll"
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
    // @ts-expect-error ref can be null
    ref?.current?.focus();
  }, [props.message, config?.chatMode]);

  const placeholder = config?.chatMode === 'web' ? 'what to search?' : config?.chatMode === 'page' ? 'about the page..' : '';

  return (
    <Box ml={2} position="relative" width="100%">
      <Box
        bottom={0}
        left={0}
        position="absolute"
        right={0}
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
        top={0}
      />
      <AutoResizeTextarea
        {...props}
        ref={ref}
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
        position="relative"
        pr={12}
        size="sm"
        value={props.message}
        width="100%"
        zIndex={1}
        autoFocus
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

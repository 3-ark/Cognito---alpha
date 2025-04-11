import React, { ReactNode, useState } from 'react';
import Markdown from 'react-markdown';
import { Box, Button, IconButton, Collapse, useDisclosure } from '@chakra-ui/react'; // Added Collapse, useDisclosure
import { CopyIcon } from '@chakra-ui/icons';

const Ul = ({ children }: { children: ReactNode }) => (
  <ul style={{ paddingLeft: '2rem', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>{children}</ul>
);
const P = ({ children }: { children: ReactNode }) => (
  <p style={{ paddingTop: 0, paddingBottom: '0.2rem', wordBreak: 'break-word' }}>{children}</p>
);
const Pre = ({ children }: { children: ReactNode }) => (
  <pre style={{ overflow: 'scroll', paddingLeft: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', margin: '1rem 0', background: 'var(--text)', color: 'var(--bg)', borderRadius: '16px', maxWidth: '80vw' }}>{children}</pre>
);

const Code = ({ children }: { children: ReactNode }) => {
  const [copied, setCopied] = useState(false);
  const copyToClipboard = () => {
    setCopied(true);
    navigator.clipboard.writeText(children as string);
  };

  const inline = (children?.length || 0) > 25;

  return (
    <>
      <code style={{
        color: 'var(--bg)',
        background: 'var(--text)',
        paddingLeft: !inline ? '0.5rem' : 0,
        paddingRight: !inline ? '0.5rem' : 0,
        borderRadius: '6px'
      }}
      >
        {children}
      </code>
      {inline && (
        <IconButton
          aria-label="Copy"
          icon={<CopyIcon color="var(--bg)" fontSize="sm" />}
          size="sm"
          background="var(--text)"
          borderRadius={8}
          marginLeft={2}
          marginTop={2}
          variant="solid"
          onClick={copyToClipboard}
        />
      )}
    </>
  );
};

const A = ({ children, ...props }: { children: ReactNode }) => (
  <a {...props} style={{ color: 'var(--text)', textDecoration: 'underline', padding: '2px 7px', borderRadius: '6px' }} target="_blank">{children}</a>
);

// Add this new component
const ThinkingBlock = ({ content }: { content: string }) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box mb={2}>
      <Button
        size='sm'
        onClick={onToggle}
        variant='outline'
        borderColor='var(--text)'
        color='var(--text)'
        _hover={{ bg: 'var(--active)' }}
        mb={1}
      >
        {isOpen ? 'Hide Thoughts' : 'Show Thoughts'}
      </Button>
      <Collapse in={isOpen} animateOpacity>
        <Box
          p={3}
          border='1px dashed'
          borderColor='var(--text)'
          borderRadius='md'
          bg='rgba(0,0,0,0.05)' // Slightly different background for thought block
        >
          {/* Render the thinking content, potentially also with Markdown */}
          <Markdown components={{ ul: Ul, ol: Ul, p: P, pre: Pre, code: Code, a: A }}>{content}</Markdown>
        </Box>
      </Collapse>
    </Box>
  );
};

export const Message = ({ m = '', i = 0 }) => {
  // Split the message by <think> tags, keeping the delimiters
  const parts = m.split(/(<think>[\s\S]*?<\/think>)/g).filter(part => part && part.trim() !== '');
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;

  return (
    <Box
      background={i % 2 !== 0 ? 'var(--bg)' : 'var(--active)'}
      border="2px"
      borderColor={i % 2 !== 0 ? 'var(--text)' : 'var(--text)'}
      borderRadius={16}
      className="chatMessage"
      color={i % 2 !== 0 ? 'var(--text)' : 'var(--text)'}
      fontSize="md"
      fontStyle="bold"
      fontWeight={600}
      maxWidth="calc(100% - 3rem)"
      ml={2}
      pb={1}
      pl={4}
      pr={4}
      pt={2}
      sx={{
        textAlign: 'left',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url(assets/images/paper-texture.png)',
          backgroundSize: '512px',
          backgroundRepeat: 'repeat',
          opacity: 0.5, // Adjusted opacity
          pointerEvents: 'none',
          borderRadius: '14px', // slightly less than parent to avoid edge artifacts
          mixBlendMode: 'multiply',
          filter: 'contrast(1) brightness(1) sharpen(0)',
          boxShadow: `
            inset 0 2px 4px rgba(255, 255, 255, 0.2),
            inset 0 -2px 4px rgba(0, 0, 0, 0.2),
            0 2px 4px rgba(0, 0, 0, 0.1),
            0 4px 8px rgba(0, 0, 0, 0.1),
            0 8px 16px rgba(0, 0, 0, 0.1)
          `,
        }
      }}
    >
      {/* Render parts sequentially */}
      {parts.map((part, index) => {
        const match = part.match(thinkRegex);
        if (match && match[1]) {
          // Render thinking block
          return <ThinkingBlock key={index} content={match[1]} />;
        } else {
          // Render normal markdown content
          return <Markdown key={index} components={{ ul: Ul, ol: Ul, p: P, pre: Pre, code: Code, a: A }}>{part}</Markdown>;
        }
      })}
    </Box>
  );
};

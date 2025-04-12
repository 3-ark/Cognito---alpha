import {
   ClassAttributes,HTMLAttributes, ReactNode, useState 
  } from 'react'; // Added HTMLAttributes, ClassAttributes
import Markdown from 'react-markdown';
import { CopyIcon } from '@chakra-ui/icons';
import {
 Box, Button, Collapse, IconButton, useDisclosure
} from '@chakra-ui/react';

// Define a more specific type for list props, making children optional
// and allowing other standard HTML attributes for ul/ol elements.
type ListProps = { children?: ReactNode } & HTMLAttributes<HTMLUListElement | HTMLOListElement>;

const Ul = ({ children, ...rest }: ListProps) => (
  <ul style={{
 paddingLeft: '2rem', paddingTop: '0.5rem', paddingBottom: '0.5rem'
}}
{...rest}>{children}</ul>
);

// Define a more specific type for paragraph props
type ParagraphProps = { children?: ReactNode } & HTMLAttributes<HTMLParagraphElement>;

const P = ({ children, ...rest }: ParagraphProps) => (
  <p style={{
 paddingTop: 0, paddingBottom: '0.2rem', wordBreak: 'break-word'
}}
{...rest}>{children}</p>
);

// Define a more specific type for pre props
type PreProps = { children?: ReactNode } & HTMLAttributes<HTMLPreElement>;

const Pre = ({ children, ...rest }: PreProps) => (
  <pre style={{
 overflow: 'scroll', paddingLeft: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', margin: '1rem 0', background: 'var(--text)', color: 'var(--bg)', borderRadius: '16px', maxWidth: '80vw'
}}
{...rest}>{children}</pre>
);

// Define a more specific type for code props
type CodeProps = { children?: ReactNode; className?: string; inline?: boolean } & HTMLAttributes<HTMLElement>;

const Code = ({
   children, className, inline, ...rest 
  }: CodeProps) => {
  const [copied, setCopied] = useState(false);
  const copyToClipboard = () => {
    if (typeof children === 'string') {
      setCopied(true);
      navigator.clipboard.writeText(children);
      setTimeout(() => setCopied(false), 1500); // Reset copied state after 1.5s
    }
  };

  // Determine if it's a block or inline code based on className (react-markdown convention)
  const match = /language-(\w+)/.exec(className || '');
  const isBlock = !!match; // True if className contains language-*, indicating a block

  if (isBlock) {
    return (
      <Box position="relative" my={4}>
        <pre style={{
          overflow: 'auto', // Changed from scroll to auto
          padding: '1rem', // Consistent padding
          margin: 0, // Reset margin if Box handles it
          background: 'var(--text)',
          color: 'var(--bg)',
          borderRadius: '8px', // Slightly smaller radius for blocks
          maxWidth: '100%' // Allow full width within container
        }}
{...rest}>
          <code className={className}>{children}</code>
        </pre>
        <IconButton
          _hover={{ background: 'var(--active)' }}
          aria-label={copied ? "Copied!" : "Copy code"}
          background="var(--bg)"
          color="var(--text)"
          icon={<CopyIcon />}
          position="absolute"
          right="0.5rem"
          size="sm"
          title={copied ? "Copied!" : "Copy code"} // Tooltip for better UX
          top="0.5rem"
          onClick={copyToClipboard}
        />
      </Box>
    );
  }

  // Inline code
  return (
    <code style={{
      color: 'var(--bg)',
      background: 'var(--text)',
      padding: '0.2rem 0.4rem', // Adjusted padding for inline
      borderRadius: '4px' // Smaller radius for inline
    }}
    className={className}
    {...rest}
    >
      {children}
    </code>
  );
};

// Define a more specific type for anchor props
type AnchorProps = { children?: ReactNode; href?: string } & HTMLAttributes<HTMLAnchorElement>;

const A = ({
   children, href, ...rest 
  }: AnchorProps) => (
  <a href={href}
    style={{
      color: 'var(--text)', textDecoration: 'underline', padding: '2px 7px', borderRadius: '6px'
    }}
    target="_blank"
    rel="noopener noreferrer" // Added for security
    {...rest}
  >
    {children}
  </a>
);

// Add this new component
const ThinkingBlock = ({ content }: { content: string }) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box mb={2}>
      <Button
        _hover={{ bg: 'var(--active)' }}
        borderColor='var(--text)'
        color='var(--text)'
        mb={1}
        size='sm'
        variant='outline'
        onClick={onToggle}
      >
        {isOpen ? 'Hide Thoughts' : 'Show Thoughts'}
      </Button>
      <Collapse in={isOpen} animateOpacity>
        <Box
          bg='rgba(0,0,0,0.05)' // Slightly different background for thought block
          border='1px dashed'
          borderColor='var(--text)'
          borderRadius='md'
          p={3}
        >
          {/* Render the thinking content, potentially also with Markdown */}
          {/* Pass the refined components here as well */}
          <Markdown components={{
            ul: Ul, ol: Ul, p: P, pre: Pre, code: Code, a: A
          }}>{content}</Markdown>
        </Box>
      </Collapse>
    </Box>
  );
};

export const Message = ({ m = '', i = 0 }) => {
  // Split the message by <think> tags, keeping the delimiters
  const parts = m.split(/(<think>[\s\S]*?<\/think>)/g).filter(part => part && part.trim() !== '');
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;

  // Define components object once
  const markdownComponents = {
    ul: Ul,
    ol: Ul, // Assign Ul to ol as well, since its type now allows it
    p: P,
    pre: Pre,
    code: Code,
    a: A
  };

  return (
    <Box
      background={i % 2 !== 0 ? 'var(--bg)' : 'var(--active)'}
      border="2px"
      borderColor={i % 2 !== 0 ? 'var(--text)' : 'var(--text)'}
      borderRadius={16}
      className="chatMessage"
      color={i % 2 !== 0 ? 'var(--text)' : 'var(--text)'}
      fontSize="md"
      fontStyle={'normal'}
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
          `
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
          return <Markdown key={index} components={markdownComponents}>{part}</Markdown>;
        }
      })}
    </Box>
  );
};

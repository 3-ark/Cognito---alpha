import {
   ClassAttributes, HTMLAttributes, ReactNode, useState 
  } from 'react'; // Added HTMLAttributes, ClassAttributes
import Markdown from 'react-markdown';
import { CopyIcon } from '@chakra-ui/icons';
import {
 Box, Button, Collapse, IconButton, useDisclosure
} from '@chakra-ui/react';
import remarkGfm from 'remark-gfm';
import { MessageTurn } from './ChatHistory'; // Adjust path if needed

// Update ListProps type
type ListProps = { 
  children?: ReactNode;
  ordered?: boolean; // Add ordered prop detection
} & HTMLAttributes<HTMLUListElement | HTMLOListElement>;

// Keep existing Ul component
const Ul = ({ children, ...rest }: ListProps) => (
  <ul style={{
    paddingLeft: '2rem', 
    paddingTop: '0.5rem', 
    paddingBottom: '0.5rem',
    listStyleType: 'disc' // Explicit bullet style
  }} {...rest}>
    {children}
  </ul>
);

// Add new Ol component
const Ol = ({ children, ...rest }: ListProps) => (
  <ol style={{
    paddingLeft: '2rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    listStyleType: 'decimal' // Explicit number style
  }} {...rest}>
    {children}
  </ol>
);

// Define a more specific type for paragraph props
type ParagraphProps = { children?: ReactNode } & HTMLAttributes<HTMLParagraphElement>;

const P = ({ children, ...rest }: ParagraphProps) => (
  <p style={{
    paddingTop: 0,
    paddingBottom: '0.2rem',
    wordBreak: 'break-word', // Add this line
    overflowWrap: 'break-word', // Add this line
    whiteSpace: 'pre-wrap' // Add this line
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

// Define a more specific type for anchor props
type AnchorProps = { children?: ReactNode; href?: string } & HTMLAttributes<HTMLAnchorElement>;

const A = ({
   children, href, ...rest 
  }: AnchorProps) => (
  <a href={href}
    style={{
      color: 'var(--link)', // Changed from --text to --link
      textDecoration: 'underline', 
      padding: '2px 7px', 
      borderRadius: '6px'
    }}
    target="_blank"
    rel="noopener noreferrer" // Added for security
    {...rest}
  >
    {children}
  </a>
);

// Add to your component types section
type HeadingProps = { children?: ReactNode } & HTMLAttributes<HTMLHeadingElement>;

const H1 = ({ children, ...rest }: HeadingProps) => (
  <h1 style={{
    fontSize: '1.5rem',
    fontWeight: 800,
    margin: '1rem 0 1rem',
    borderBottom: '2px solid var(--text)',
    paddingBottom: '0.5rem'
  }} {...rest}>{children}</h1>
);

const H2 = ({ children, ...rest }: HeadingProps) => (
  <h2 style={{
    fontSize: '1.25rem',
    fontWeight: 700,
    margin: '1rem 0 0.75rem',
    borderBottom: '1px solid var(--text)',
    paddingBottom: '0.4rem'
  }} {...rest}>{children}</h2>
);

// Add H3 component after H2
const H3 = ({ children, ...rest }: HeadingProps) => (
  <h3 style={{
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: '0.75rem 0 0.5rem',
    borderBottom: '1px dashed var(--text)',
    paddingBottom: '0.3rem'
  }} {...rest}>{children}</h3>
);

// Add similar components for h3-h6 as needed...

// Add new components for strong/em
type StrongProps = { children?: ReactNode } & HTMLAttributes<HTMLElement>;
const Strong = ({ children, ...rest }: StrongProps) => (
  <strong style={{ 
    color: 'var(--bold)',
    fontWeight: 700, // Keep bold weight
    fontFamily: 'Poppins, sans-serif' // Explicit font stack
  }} {...rest}>{children}</strong>
);

type EmProps = { children?: ReactNode } & HTMLAttributes<HTMLElement>;
const Em = ({ children, ...rest }: EmProps) => (
  <em style={{ 
    color: 'var(--italic)',
    fontStyle: 'italic' // Keep italic slant
  }} {...rest}>{children}</em>
);

// Add new table components after Em component
type TableProps = { children?: ReactNode } & HTMLAttributes<HTMLTableElement>;
const Table = ({ children, ...rest }: TableProps) => (
  <table style={{ 
    border: `2px solid var(--text)`,
    borderCollapse: 'collapse',
    width: '100%',
    margin: '1rem 0'
  }} {...rest}>{children}</table>
);

type THeadProps = { children?: ReactNode } & HTMLAttributes<HTMLTableSectionElement>;
const THead = ({ children, ...rest }: THeadProps) => (
  <thead style={{ 
    background: 'var(--active)',
    borderBottom: `2px solid var(--text)`
  }} {...rest}>{children}</thead>
);

type TBodyProps = { children?: ReactNode } & HTMLAttributes<HTMLTableSectionElement>;
const TBody = ({ children, ...rest }: TBodyProps) => (
  <tbody {...rest}>{children}</tbody>
);

type TrProps = { children?: ReactNode } & HTMLAttributes<HTMLTableRowElement>;
const Tr = ({ children, ...rest }: TrProps) => (
  <tr style={{ 
    '&:hover': {
      background: 'rgba(0,0,0,0.05)'
    }
  }} {...rest}>{children}</tr>
);

type ThProps = { children?: ReactNode } & HTMLAttributes<HTMLTableCellElement>;
const Th = ({ children, ...rest }: ThProps) => (
  <th style={{
    padding: '0.5rem',
    border: `1px solid var(--text)`,
    fontWeight: 700
  }} {...rest}>{children}</th>
);

type TdProps = { children?: ReactNode } & HTMLAttributes<HTMLTableCellElement>;
const Td = ({ children, ...rest }: TdProps) => (
  <td style={{
    padding: '0.5rem',
    border: `1px solid var(--text)`
  }} {...rest}>{children}</td>
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
          <div className="markdown-body">
            <Markdown 
              remarkPlugins={[remarkGfm]}
              components={{
                ...markdownComponents, // Spread existing components
                h1: H1,
                h2: H2,
                h3: H3
              }}>{content}</Markdown>
          </div>
        </Box>
      </Collapse>
    </Box>
  );
};

// Update markdownComponents mapping
const markdownComponents = {
  ul: Ul,
  ol: Ol, // Changed from Ul to new Ol component
  p: P,
  pre: Pre,
  code: Code,
  a: A,
  strong: Strong, // Add strong mapping
  em: Em,        // Add em mapping
  h1: H1,
  h2: H2,
  h3: H3, // Add H3 to components
  table: Table,
  thead: THead,
  tbody: TBody,
  tr: Tr,
  th: Th,
  td: Td
};

interface MessageProps {
  turn: MessageTurn;
  index: number; // Keep index if needed for styling/keys further down
}

export const Message: React.FC<MessageProps> = ({ turn, index }) => {
  // Split the message by <think> tags, keeping the delimiters
  const contentToRender = turn.rawContent || '';
  const parts = contentToRender.split(/(<think>[\s\S]*?<\/think>)/g).filter(part => part && part.trim() !== '');
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;
  // Define components object once

  return (
    <Box
      // --- Style based on turn.role ---
      background={turn.role === 'assistant' ? 'var(--active)' : 'var(--bg)'}
      border="2px"
      borderColor={turn.role === 'assistant' ? 'var(--text)' : 'var(--text)'} // Or use different borders?
      borderRadius={16}
      className="chatMessage" // --- Keep this class for downloadImage ---
      color={'var(--text)'} // Assuming text color is consistent
      fontSize="md"
      fontStyle={'normal'}
      fontWeight={600}
       // --- Adjust maxWidth/margins based on role if needed ---
       maxWidth="calc(100% - 3rem)" // Maybe adjust for user vs assistant?
       // ml={turn.role === 'assistant' ? 2 : 'auto'} // Example alignment adjustment
       // mr={turn.role === 'user' ? 2 : 'auto'} // Example alignment adjustment
       ml={2} // Keep original for now
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
      <div className="message-markdown">
        {/* --- Conditionally Render Prefix for Assistant --- */}
        {turn.role === 'assistant' && turn.webDisplayContent && (
          <div className="message-prefix"> {/* Optional wrapper class */}
             <Markdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {`**From the Internet**\n${turn.webDisplayContent}\n\n---\n\n`}
              </Markdown>
          </div>
        )}

       {/* Render actual content parts (including thinking blocks) */}
        {parts.map((part, partIndex) => {
          const match = part.match(thinkRegex);

          if (match && match[1]) {
            // Render thinking block
            return <ThinkingBlock key={`think_${partIndex}`} content={match[1]} />;
          } else {
            // Render normal markdown content from turn.rawContent
            return (
              // Using partIndex for key as part content might not be unique
              <div key={`content_${partIndex}`} className="message-content">
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {part}
                </Markdown>
              </div>
            );
          }
        })}
      </div>
    </Box>
  );
};
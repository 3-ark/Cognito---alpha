import '../content/index.scss'; // Import your markdown styles
import {
  ClassAttributes, HTMLAttributes, ReactNode, useState
} from 'react';
import Markdown from 'react-markdown';
import { FiCopy, FiCheck, FiX } from 'react-icons/fi'; // Import FiCheck and FiX
import AutosizeTextarea from 'react-textarea-autosize';
import {
  Textarea,
  HStack,
  VStack,
  Button as ChakraButton, // Alias to avoid naming conflict if needed elsewhere
} from '@chakra-ui/react';

import {
  Box, Button, Collapse, IconButton, useDisclosure
} from '@chakra-ui/react';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { useConfig } from './ConfigContext'; // <-- Import useConfig
import remarkSupersub from 'remark-supersub';
import { MessageTurn } from './ChatHistory';

// List components
type ListProps = {
  children?: ReactNode;
  ordered?: boolean;
} & HTMLAttributes<HTMLUListElement | HTMLOListElement>;

const Ul = ({ children, ...rest }: ListProps) => (
  <ul style={{
    paddingLeft: '2rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    listStyleType: 'disc'
  }} {...rest}>{children}</ul>
);

const Ol = ({ children, ...rest }: ListProps) => (
  <ol style={{
    paddingLeft: '2rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    listStyleType: 'decimal'
  }} {...rest}>{children}</ol>
);

// Paragraph
type ParagraphProps = { children?: ReactNode } & HTMLAttributes<HTMLParagraphElement>;
const P = ({ children, ...rest }: ParagraphProps) => (
  <p style={{
    paddingTop: 0,
    paddingBottom: '0.2rem',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    whiteSpace: 'pre-wrap'
  }} {...rest}>{children}</p>
);

// Pre/code
type PreProps = { children?: ReactNode } & HTMLAttributes<HTMLPreElement>;
const Pre = ({ children, ...rest }: PreProps) => (
  <pre style={{
    overflow: 'scroll',
    paddingLeft: '1rem',
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    margin: '1rem 0',
    background: 'var(--markdown-pre-bg, var(--text))',
    color: 'var(--markdown-pre-fg, var(--bg))',
    borderRadius: '16px',
    maxWidth: '80vw'
  }} {...rest}>{children}</pre>
);

type CodeProps = { children?: ReactNode; className?: string; inline?: boolean } & HTMLAttributes<HTMLElement>;
const Code = ({ children, className, inline, ...rest }: CodeProps) => {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const copyToClipboard = () => {
    if (typeof children === 'string') {
      setCopied(true);
      navigator.clipboard.writeText(children);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const match = /language-(\w+)/.exec(className || '');
  const isBlock = !!match;

  if (isBlock) {
    return (
      <Box
        position="relative"
        my={4}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <pre style={{
          overflow: 'auto',
          padding: '1rem',
          margin: 0,
          background: 'var(--markdown-code-bg, var(--text))',
          color: 'var(--markdown-code-fg, var(--bg))',
          borderRadius: '8px',
          maxWidth: '100%'
        }} {...rest}>
          <code className={className}>{children}</code>
        </pre>
        <IconButton
          _hover={{ background: 'var(--active)' }}
          aria-label={copied ? "Copied!" : "Copy code"}
          background="var(--bg)"
          color="var(--text)"
          icon={<FiCopy />}
          position="absolute"
          right="0.5rem"
          size="sm"
          title={copied ? "Copied!" : "Copy code"}
          top="0.5rem"
          onClick={copyToClipboard}
          opacity={hovered ? 1 : 0}
          transition="opacity 0.2s"
          pointerEvents={hovered ? 'auto' : 'none'}
        />
      </Box>
    );
  }

  // Inline code
  return (
    <code style={{
      color: 'var(--markdown-code-fg, var(--bg))',
      background: 'var(--markdown-code-bg, var(--text))',
      padding: '0.2rem 0.4rem',
      borderRadius: '4px'
    }}
    className={className}
    {...rest}
    >
      {children}
    </code>
  );
};

// Anchor
type AnchorProps = { children?: ReactNode; href?: string } & HTMLAttributes<HTMLAnchorElement>;
const A = ({ children, href, ...rest }: AnchorProps) => (
  <a href={href}
    style={{
      color: 'var(--markdown-link, var(--link))',
      textDecoration: 'underline',
      padding: '2px 7px',
      borderRadius: '6px'
    }}
    target="_blank"
    rel="noopener noreferrer"
    {...rest}
  >
    {children}
  </a>
);

// Headings
type HeadingProps = { children?: ReactNode } & HTMLAttributes<HTMLHeadingElement>;
const H1 = ({ children, ...rest }: HeadingProps) => (
  <h1 style={{
    fontSize: '1.5rem',
    fontWeight: 800,
    margin: '1rem 0 1rem',
    borderBottom: '2px solid var(--markdown-h1, var(--text))',
    paddingBottom: '0.5rem',
    color: 'var(--markdown-h1, var(--text))'
  }} {...rest}>{children}</h1>
);

const H2 = ({ children, ...rest }: HeadingProps) => (
  <h2 style={{
    fontSize: '1.25rem',
    fontWeight: 700,
    margin: '1rem 0 0.75rem',
    borderBottom: '1px solid var(--markdown-h2, var(--text))',
    paddingBottom: '0.4rem',
    color: 'var(--markdown-h2, var(--text))'
  }} {...rest}>{children}</h2>
);

const H3 = ({ children, ...rest }: HeadingProps) => (
  <h3 style={{
    fontSize: '1.1rem',
    fontWeight: 600,
    margin: '0.75rem 0 0.5rem',
    borderBottom: '1px dashed var(--markdown-h3, var(--text))',
    paddingBottom: '0.3rem',
    color: 'var(--markdown-h3, var(--text))'
  }} {...rest}>{children}</h3>
);

// Strong/Em
type StrongProps = { children?: ReactNode } & HTMLAttributes<HTMLElement>;
const Strong = ({ children, ...rest }: StrongProps) => (
  <strong style={{
    color: 'var(--markdown-strong, var(--bold))',
    fontWeight: 700,
    fontFamily: 'Poppins, sans-serif'
  }} {...rest}>{children}</strong>
);

type EmProps = { children?: ReactNode } & HTMLAttributes<HTMLElement>;
const Em = ({ children, ...rest }: EmProps) => (
  <em style={{
    color: 'var(--markdown-em, var(--italic))',
    fontStyle: 'italic'
  }} {...rest}>{children}</em>
);

// Table
type TableProps = { children?: ReactNode } & HTMLAttributes<HTMLTableElement>;
const Table = ({ children, ...rest }: TableProps) => (
  <table style={{
    border: `2px solid var(--markdown-table-border, var(--text))`,
    borderCollapse: 'collapse',
    width: '100%',
    margin: '1rem 0'
  }} {...rest}>{children}</table>
);

type THeadProps = { children?: ReactNode } & HTMLAttributes<HTMLTableSectionElement>;
const THead = ({ children, ...rest }: THeadProps) => (
  <thead style={{
    background: 'var(--active)',
    borderBottom: `2px solid var(--markdown-table-border, var(--text))`
  }} {...rest}>{children}</thead>
);

type TBodyProps = { children?: ReactNode } & HTMLAttributes<HTMLTableSectionElement>;
const TBody = ({ children, ...rest }: TBodyProps) => (
  <tbody {...rest}>{children}</tbody>
);

type TrProps = { children?: ReactNode } & HTMLAttributes<HTMLTableRowElement>;
const Tr = ({ children, ...rest }: TrProps) => (
  <Box
    as="tr"
    _hover={{ background: 'rgba(0,0,0,0.05)' }}
    {...rest}
  >
    {children}
  </Box>
);

type ThProps = { children?: ReactNode } & HTMLAttributes<HTMLTableCellElement>;
const Th = ({ children, ...rest }: ThProps) => (
  <th style={{
    padding: '0.5rem',
    border: `1px solid var(--markdown-table-border, var(--text))`,
    fontWeight: 700
  }} {...rest}>{children}</th>
);

type TdProps = { children?: ReactNode } & HTMLAttributes<HTMLTableCellElement>;
const Td = ({ children, ...rest }: TdProps) => (
  <td style={{
    padding: '0.5rem',
    border: `1px solid var(--markdown-table-border, var(--text))`
  }} {...rest}>{children}</td>
);

// Blockquote
type BlockquoteProps = { children?: ReactNode } & HTMLAttributes<HTMLElement>;
const Blockquote = ({ children, ...rest }: BlockquoteProps) => (
  <blockquote
    style={{
      borderLeft: '4px solid var(--markdown-h2, var(--text))',
      margin: '1em 0',
      padding: '0.5em 1em',
      background: 'rgba(0,0,0,0.03)',
      color: 'var(--markdown-h2, var(--text))'
    }}
    {...rest}
  >
    {children}
  </blockquote>
);

// Thinking block
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
          bg='rgba(0,0,0,0.05)'
          border='1px dashed'
          borderColor='var(--text)'
          borderRadius='md'
          p={3}
        >
          <div className="markdown-body">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                ...markdownComponents,
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

// Markdown components mapping
const markdownComponents = {
  ul: Ul,
  ol: Ol,
  p: P,
  pre: Pre,
  code: Code,
  a: A,
  strong: Strong,
  em: Em,
  h1: H1,
  h2: H2,
  h3: H3,
  table: Table,
  thead: THead,
  tbody: TBody,
  tr: Tr,
  th: Th,
  td: Td,
  blockquote: Blockquote // <-- Add this line
};

interface MessageProps {
  turn: MessageTurn;
  index: number; // Keep index
  // Add editing props
  isEditing: boolean;
  editText: string;
  onStartEdit: (index: number, currentContent: string) => void;
  onSetEditText: (text: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

// Rename component to reflect its new capability
export const EditableMessage: React.FC<MessageProps> = ({
  turn, index, isEditing, editText, onStartEdit, onSetEditText, onSaveEdit, onCancelEdit
}) => {
  const { config } = useConfig(); // <-- Get config
  const contentToRender = turn.rawContent || ''; // Still needed for display mode and starting edit
  const parts = contentToRender.split(/(<think>[\s\S]*?<\/think>)/g).filter(part => part && part.trim() !== '');
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;

  return (
    <Box
      background={turn.role === 'assistant' ? 'var(--active)' : 'var(--bg)'}
      border="1px"
      borderColor={turn.role === 'assistant' ? 'var(--text)' : 'var(--text)'}
      borderRadius={16}
      className={`chatMessage ${config?.paperTexture ? 'chat-message-bubble' : ''}`} // <-- Add conditional class
      color={'var(--text)'}
      fontSize="md"
      fontStyle={'normal'}
      fontWeight={600}
      // Let's try explicitly setting width instead of maxWidth
      width="calc(100% - 3rem)" // Or try "98%" if you prefer that look
      ml={2}
      mr={2}
      pb={1}
      pl={4}
      pr={4}
      pt={2}
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)" // Soft shadow added here
      sx={{
        // Keep position relative for potential future absolute positioned children
        textAlign: 'left',
        position: 'relative',
      }}
      // Add double-click handler ONLY for user messages to initiate editing
      onDoubleClick={() => {
        // Allow editing for both user and assistant messages
        if (!isEditing) {
          onStartEdit(index, turn.rawContent);
        }
      }}
      title={"Double-click to edit"} // Add tooltip hint for all messages
    >
      {isEditing ? (
        // --- Editing UI ---
        <VStack spacing={2} align="stretch" width="100%">
          <Textarea
            as={AutosizeTextarea} // Use the autosize component
            value={editText}
            onChange={(e) => onSetEditText(e.target.value)}
            placeholder="Edit your message..."
            size="md" // Adjust size as needed
            width="100%"// Adjust to fit the container
            minRows={3} // Start with a minimum of 3 rows
            // minHeight="100px" // Or set a larger minHeight if you prefer over minRows
            bg="var(--bg)" // Use background color for contrast
            color="var(--text)"
            borderColor="var(--text)"
            focusBorderColor="var(--link)" // Use link color for focus
            _hover={{ borderColor: "var(--link)" }}
            autoFocus // Focus the textarea when editing starts
          />
          <HStack justify="flex-end" spacing={2}>
            <IconButton
              aria-label="Save edit"
              icon={<FiCheck />} // Use FiCheck
              size="sm"
              colorScheme="green" // Use Chakra color schemes
              variant="solid"
              onClick={onSaveEdit}
              title="Save changes"
            />
            <IconButton
              aria-label="Cancel edit"
              icon={<FiX />} // Use FiX
              size="sm"
              colorScheme="red" // Use Chakra color schemes
              variant="outline"
              onClick={onCancelEdit}
              title="Discard changes"
            />
          </HStack>
        </VStack>
      ) : (
        // --- Display UI (Original Content) ---
        <div className="message-markdown" style={{ position: 'relative', zIndex: 1 }}> {/* <-- Ensure content is above texture */}
          {turn.role === 'assistant' && turn.webDisplayContent && (
            <div className="message-prefix">
              <Markdown remarkPlugins={[[remarkGfm, { singleTilde: false }], remarkMath, remarkSupersub]} components={markdownComponents}>
                {`**From the Internet**\n${turn.webDisplayContent}\n\n---\n\n`}
              </Markdown>
            </div>
          )}
          {parts.map((part, partIndex) => {
            const match = part.match(thinkRegex);
            if (match && match[1]) {
              return <ThinkingBlock key={`think_${partIndex}`} content={match[1]} />;
            } else {
              return (
                <div key={`content_${partIndex}`} className="message-content">
                <Markdown
                  remarkPlugins={[[remarkGfm, { singleTilde: false }], remarkMath, remarkSupersub]}
                  components={markdownComponents}
                >{part}</Markdown>
                </div>
              );
            }
          })}
        </div>
      )}
    </Box>
  );
};
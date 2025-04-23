import React from 'react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import {
 AccordionButton, AccordionItem, AccordionPanel, Link, Text 
} from '@chakra-ui/react';

import { ConnectGemini } from './ConnectGemini';
import { ConnectGroq } from './ConnectGroq';
import { ConnectLmStudio } from './ConnectLmStudio';
import { ConnectOllama } from './ConnectOllama';
import { ConnectOpenAI } from './ConnectOpenAI';
import { ConnectOpenRouter } from './ConnectOpenRouter';
import { ConnectCustom2 } from './connectCustom2';
import { SettingTitle } from './SettingsTitle';

type ConnectionProps = {
  title: string;
  Component: React.FC<unknown>;
  link?: string;
};

const borderStyle: string = '2px solid var(--text)';
const textStyle = {
  fontWeight: 800,
  paddingTop: 2,
  paddingBottom: 2,
  paddingLeft: 4,
  fontSize: 'lg',
  color: 'var(--text)'
};

const ConnectionSection: React.FC<ConnectionProps> = ({
 title, Component, link 
}) => (
  <>
    <Text textAlign="left" {...textStyle}>
      {title}
      {' '}
      {link && (
      <Link color="var(--text)" fontSize="sm" href={link} ml="0.5rem" isExternal>
        api keys
        {' '}
        <ExternalLinkIcon mx="2px" />
      </Link>
      )}
    </Text>
    <Component />
  </>
);

export const Connect: React.FC = () => (
  <AccordionItem border={borderStyle} borderRadius={16} mb={4} mt={2}>
    <AccordionButton _hover={{ backgroundColor: 'transparent' }} paddingBottom={1} paddingRight={2}>
      <SettingTitle icon="🔗" padding={0} text="connections" />
    </AccordionButton>
    <AccordionPanel p={0}>
      <ConnectionSection Component={ConnectOllama} title="ollama" />
      <ConnectionSection Component={ConnectLmStudio} title="lm studio" />
      <ConnectionSection Component={ConnectGroq} link="https://console.groq.com/keys" title="groq" />
      <ConnectionSection Component={ConnectGemini} link="https://aistudio.google.com/app/apikey" title="gemini" /> 
      <ConnectionSection Component={ConnectOpenAI} link="https://platform.openai.com/api-keys" title="openai" />
      <ConnectionSection Component={ConnectOpenRouter} link="https://openrouter.ai/settings/keys" title="openrouter" />
      <ConnectionSection Component={ConnectCustom2} title="custom endpoint" />
    </AccordionPanel>
  </AccordionItem>
);

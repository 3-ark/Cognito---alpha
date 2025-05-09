import { Box, Image } from '@chakra-ui/react';
import { useConfig } from './ConfigContext';

const personaImages = {
  Agatha: 'assets/images/agatha.png',
  Bruce: 'assets/images/bruce.png',
  Warren: 'assets/images/Cognito.png',
  Charlie: 'assets/images/bruce.png',
  Jan: 'assets/images/jan.png',
  Sherlock: 'assets/images/Cognito.png',
  Ein: 'assets/images/ein.png',
  // fallback/default
  default: 'assets/images/Cognito.png'
};

export const Background = () => {
  const { config } = useConfig();
  const persona = config?.persona || 'default';
  const src = personaImages[persona] || personaImages.default;

  return (
    <Box
      alignItems="center"
      display="flex"
      height="80vh"
      justifyContent="center"
      style={{
        position: 'fixed', width: '100%', top: '10%', pointerEvents: 'none'
      }}
    >
      <Image
        src={src}
        style={{
          filter: 'opacity(0.03)',
          position: 'fixed',
          zoom: '1.2',
          zIndex: 1
        }}
      />
    </Box>
  );
};

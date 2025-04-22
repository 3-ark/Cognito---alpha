import { Box, Image } from '@chakra-ui/react';
import { useConfig } from './ConfigContext';

const personaImages = {
  Agatha: 'assets/images/agatha.jpg',
  Bruce: 'assets/images/bruce.jpg',
  Warren: 'assets/images/Cognito.jpg',
  Charlie: 'assets/images/bruce.jpg',
  Jan: 'assets/images/jan.jpg',
  Sherlock: 'assets/images/Cognito.jpg',
  Ein: 'assets/images/ein.png',
  // fallback/default
  default: 'assets/images/Cognito.jpg'
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

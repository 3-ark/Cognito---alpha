import { Box, Image } from '@chakra-ui/react';

export const Background = () => (
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
      src="assets/images/Bruside.png"
      style={{ 
        filter: 'opacity(0.03)', 
        position: 'fixed', 
        zoom: '1.2',
        zIndex: 1 
      }}
    />
  </Box>
);

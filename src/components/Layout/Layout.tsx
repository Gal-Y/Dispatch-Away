import React, { ReactNode } from 'react';
import { Container, Box, CssBaseline } from '@mui/material';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Navbar />
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.grey[100],
          textAlign: 'center',
          fontSize: '0.875rem',
          color: (theme) => theme.palette.text.secondary,
        }}
      >
        IBM Dispatch Dashboard © {new Date().getFullYear()}
      </Box>
    </Box>
  );
};

export default Layout; 
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Routes, Route, Link, Outlet, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { 
  CssBaseline, 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  Button,
  useMediaQuery,
  Tabs,
  Tab,
  Paper,
  SvgIcon
} from '@mui/material';
import { AppProvider } from './context/AppContext';
import './App.css';

// Import actual page components
import EngineerManagement from './pages/EngineerManagement';
import SiloManagement from './pages/SiloManagement';
import Dashboard from './pages/Dashboard';

// Add these imports after existing page/component imports
import DailyView from './components/dashboard/DailyView';
import WeeklyView from './components/dashboard/WeeklyView';
import TemporaryRoster from './components/dashboard/TemporaryRoster';

// Create a custom dark theme with IBM colors
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0f62fe', // IBM Blue
      light: '#4589ff',
      dark: '#0043ce',
    },
    secondary: {
      main: '#6929c4', // IBM Purple
      light: '#8a3ffc',
      dark: '#491d8b',
    },
    background: {
      default: '#161616', // IBM Carbon dark background
      paper: '#262626',   // IBM Carbon dark paper
    },
    text: {
      primary: '#f4f4f4',
      secondary: '#c6c6c6',
    },
    error: {
      main: '#fa4d56', // IBM Red
    },
    warning: {
      main: '#ff832b', // IBM Orange
    },
    info: {
      main: '#4589ff', // IBM Blue light
    },
    success: {
      main: '#42be65', // IBM Green
    },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 300,
    },
    h2: {
      fontWeight: 400,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#161616', // IBM Carbon dark background
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: 'none',
          fontWeight: 500,
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#0043ce',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        },
        indicator: {
          height: 3,
        },
      },
    },
  },
});

// Layout component
const Layout = () => {
  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100vw',
      maxWidth: '100%',
      margin: 0,
      padding: 0
    }}>
      <AppBar position="fixed" sx={{ zIndex: 9999, pointerEvents: 'auto' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SvgIcon sx={{ 
                color: 'white', 
                mr: 1,
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'rotate(10deg)' }
              }}>
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </SvgIcon>
            <Typography 
              variant="h6" 
              component="div"
              sx={{ transition: 'letter-spacing 0.3s ease', '&:hover': { letterSpacing: '2px' } }}
            >
              Dispatch Away
            </Typography>
          </Box>
          <Box sx={{ position: 'relative', zIndex: 9999 }}>
            <Button 
              color="inherit"
              component={Link}
              to="/dashboard/daily"
              sx={{ 
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 9999,
                transition: 'transform 0.3s ease, color 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  color: '#8a3ffc'
                },
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: '0%',
                  height: '2px',
                  backgroundColor: '#8a3ffc',
                  transition: 'width 0.3s ease'
                },
                '&:hover:after': {
                  width: '100%'
                }
              }}
            >
              Dashboard
            </Button>
            <Button 
              color="inherit"
              component={Link}
              to="/engineers"
              sx={{ 
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 9999,
                transition: 'transform 0.3s ease, color 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  color: '#8a3ffc'
                },
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: '0%',
                  height: '2px',
                  backgroundColor: '#8a3ffc',
                  transition: 'width 0.3s ease'
                },
                '&:hover:after': {
                  width: '100%'
                }
              }}
            >
              Engineers
            </Button>
            <Button 
              color="inherit"
              component={Link}
              to="/silos"
              sx={{ 
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 9999,
                transition: 'transform 0.3s ease, color 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  color: '#8a3ffc'
                },
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  bottom: 0,
                  width: '0%',
                  height: '2px',
                  backgroundColor: '#8a3ffc',
                  transition: 'width 0.3s ease'
                },
                '&:hover:after': {
                  width: '100%'
                }
              }}
            >
              Silos
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar />
      
      <Box component="main" sx={{ 
        flexGrow: 1,
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        padding: 0,
        overflow: 'visible'
      }}>
        <Outlet />
      </Box>
      
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          backgroundColor: theme.palette.background.paper,
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          IBM Dispatch Dashboard © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppProvider>
          <Routes>
            {/* Redirect root to /dashboard/daily */}
            <Route path="/" element={<Navigate to="/dashboard/daily" replace />} />
            <Route element={<Layout />}>
              <Route path="dashboard" element={<Dashboard />}>
                <Route index element={<Navigate to="daily" replace />} />
                <Route path="daily" element={<DailyView />} />
                <Route path="weekly" element={<WeeklyView />} />
                <Route path="roster" element={<TemporaryRoster />} />
              </Route>
              <Route path="engineers" element={<EngineerManagement />} />
              <Route path="silos" element={<SiloManagement />} />
            </Route>
            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/dashboard/daily" replace />} />
          </Routes>
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;

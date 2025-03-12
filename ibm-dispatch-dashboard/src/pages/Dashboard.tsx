import React from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import AssignmentIcon from '@mui/icons-material/Assignment';

const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine the active tab by checking the URL
  // If the pathname includes '/dashboard/weekly', active tab is 1, else default to 0 (daily view)
  const activeTab = location.pathname.includes('/dashboard/weekly') ? 1 : 0;
  
  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) {
      navigate('/dashboard/daily');
    } else {
      navigate('/dashboard/weekly');
    }
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Box 
        sx={{ 
          mb: 4, 
          p: 3, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #4589ff, #8a3ffc)',
          backgroundSize: '200% 200%',
          color: 'white',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeInDown 1s ease-out, gradientShift 10s ease infinite',
          '@keyframes fadeInDown': {
            '0%': { opacity: 0, transform: 'translateY(-20px)' },
            '100%': { opacity: 1, transform: 'translateY(0)' }
          },
          '@keyframes gradientShift': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' }
          }
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            right: 0,
            width: '150px',
            height: '150px',
            opacity: 0.2,
            transform: 'translate(30%, -30%)',
            borderRadius: '50%',
            background: 'white',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': { transform: 'translate(30%, -30%) scale(0.95)', opacity: 0.2 },
              '50%': { transform: 'translate(30%, -30%) scale(1.05)', opacity: 0.25 },
              '100%': { transform: 'translate(30%, -30%) scale(0.95)', opacity: 0.2 }
            }
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: '50%', 
              p: 1.5, 
              mr: 2, 
              display: 'flex',
              transition: 'transform 0.3s ease',
              '&:hover': { transform: 'scale(1.1) rotate(5deg)' }
            }}
          >
            <AssignmentIcon sx={{ fontSize: 40, transition: 'transform 0.3s ease' }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
              Case Dispatch Dashboard
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9 }}>
              Manage and track support cases assigned to engineers
            </Typography>
          </Box>
        </Box>
      </Box>

      <Paper elevation={1}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleChange} 
            aria-label="dashboard tabs"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 'bold',
                fontSize: '1rem',
                textTransform: 'none',
              }
            }}
          >
            <Tab label="Daily View" id="dashboard-tab-0" aria-controls="dashboard-tabpanel-0" />
            <Tab label="Weekly Distribution" id="dashboard-tab-1" aria-controls="dashboard-tabpanel-1" />
          </Tabs>
        </Box>
        <Box sx={{ 
          p: 3,
          animation: 'fadeInContent 1s ease-out',
          '@keyframes fadeInContent': {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 }
          }
        }}>
          <Outlet />
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard; 
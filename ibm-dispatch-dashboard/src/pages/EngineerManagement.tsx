import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Avatar,
  Divider,
  Container,
  Chip,
  Stack,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Engineering as EngineeringIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { Engineer } from '../models/types';

const EngineerManagement: React.FC = () => {
  const { engineers, addEngineer, updateEngineer, removeEngineer, silos } = useAppContext();
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<Engineer>>({
    name: '',
    email: '', // Keep in data model but don't show in UI
    siloIds: [], // Array of silo IDs
    isActive: true, // Keep in data model but don't show in UI
    label: '',
    disableAssignment: false
  });
  const [isEditMode, setIsEditMode] = useState(false);
  
  const handleOpenDialog = (engineer?: Engineer) => {
    if (engineer) {
      // Edit mode
      setFormData({
        ...engineer
      });
      setIsEditMode(true);
    } else {
      // Add mode
      setFormData({
        name: '',
        email: '', // Default empty value
        siloIds: [], // Empty array for siloIds
        isActive: true, // Default to active
        label: '',
        disableAssignment: false
      });
      setIsEditMode(false);
    }
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData({
      ...formData,
      [name]: checked
    });
  };
  
  const handleSaveEngineer = () => {
    if (!formData.name) {
      // Only validate name field
      alert('Please enter the engineer name');
      return;
    }
    
    // Set default values for hidden fields
    const engineerData = {
      ...formData,
      email: formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Generate a default email
      siloIds: formData.siloIds || [], // Empty array for siloIds
      isActive: true, // Always active by default
      label: formData.label || '',
      disableAssignment: formData.disableAssignment || false
    };
    
    if (isEditMode && formData.id) {
      // Update existing engineer
      updateEngineer(formData.id, engineerData);
    } else {
      // Add new engineer
      addEngineer(engineerData as Omit<Engineer, 'id'>);
    }
    
    handleCloseDialog();
  };
  
  const handleDeleteEngineer = (id: string) => {
    if (window.confirm('Are you sure you want to delete this engineer?')) {
      removeEngineer(id);
    }
  };
  
  // Function to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Function to generate a consistent color based on name
  const getAvatarColor = (name: string): string => {
    const colors = [
      '#4589ff', // IBM Blue
      '#8a3ffc', // IBM Purple
      '#33b1ff', // IBM Cyan
      '#fa4d56', // IBM Red
      '#4589ff', // IBM Blue
      '#08bdba', // IBM Teal
      '#ff832b', // IBM Orange
      '#6fdc8c', // IBM Green
    ];
    
    // Simple hash function to get a consistent index
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  return (
    <Container maxWidth={false} sx={{ width: '100%', p: 0 }}>
      {/* Enhanced Header Section */}
      <Box 
        sx={{ 
          mb: 4, 
          p: 3, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #4589ff 0%, #8a3ffc 100%)',
          color: 'white',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          overflow: 'hidden'
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
            background: 'white'
          }}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box 
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.2)', 
              borderRadius: '50%', 
              p: 1.5,
              mr: 2,
              display: 'flex'
            }}
          >
            <EngineeringIcon sx={{ fontSize: 40 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
              Engineer Management
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9 }}>
              Add, edit, or remove engineers from the system
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            borderRadius: 28,
            px: 3,
            py: 1.2,
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.95rem',
            background: 'linear-gradient(90deg, #4589ff 0%, #6ea6ff 100%)',
            '&:hover': {
              background: 'linear-gradient(90deg, #4589ff 30%, #8a3ffc 100%)',
              boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)',
            }
          }}
        >
          Add New Engineer
        </Button>
      </Box>
      
      {/* Card-based Engineer Layout */}
      {engineers.length > 0 ? (
        <Grid container spacing={3}>
          {engineers.map((engineer) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={engineer.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                  },
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Decorative top bar */}
                <Box 
                  sx={{ 
                    height: '6px', 
                    width: '100%', 
                    background: 'linear-gradient(90deg, #4589ff 30%, #8a3ffc 100%)'
                  }} 
                />
                
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                  <Avatar 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      mb: 2,
                      bgcolor: getAvatarColor(engineer.name),
                      fontSize: '1.8rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {getInitials(engineer.name)}
                  </Avatar>
                  
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    align="center" 
                    sx={{ 
                      fontWeight: 600,
                      mb: 1
                    }}
                  >
                    {engineer.name}
                  </Typography>
                  
                  {/* Display assigned silos */}
                  {engineer.siloIds && engineer.siloIds.length > 0 ? (
                    <Box sx={{ mb: 2, mt: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Assigned to:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
                        {engineer.siloIds.map(siloId => {
                          const silo = silos.find(s => s.id === siloId);
                          return silo ? (
                            <Chip
                              key={siloId}
                              size="small"
                              icon={<BusinessIcon style={{ fontSize: '0.8rem' }} />}
                              label={silo.name}
                              sx={{ 
                                m: 0.5, 
                                bgcolor: 'rgba(69, 137, 255, 0.1)',
                                color: 'primary.main',
                                fontWeight: 500,
                                '& .MuiChip-icon': { color: 'primary.main' }
                              }}
                            />
                          ) : null;
                        })}
                      </Stack>
                    </Box>
                  ) : (
                    <Box sx={{ mb: 2, mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" align="center">
                        Not assigned to any silo
                      </Typography>
                    </Box>
                  )}
                  
                  {engineer.label && (
                    <Chip 
                      label={engineer.label} 
                      size="small" 
                      sx={{ mt: 1 }}
                    />
                  )}
                  {engineer.disableAssignment && (
                    <Chip 
                      label="Case Assignment Disabled" 
                      size="small" 
                      color="error"
                      sx={{ mt: 1 }}
                    />
                  )}
                  
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      mt: 'auto'
                    }}
                  >
                    <PersonIcon sx={{ color: 'text.secondary', mr: 0.5, fontSize: '1rem' }} />
                    <Typography variant="body2" color="text.secondary">
                      Engineer
                    </Typography>
                  </Box>
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ mt: 2, p: 0 }}>
                  <IconButton 
                    color="primary" 
                    onClick={() => handleOpenDialog(engineer)}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    color="secondary" 
                    onClick={() => handleDeleteEngineer(engineer.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 5, 
            textAlign: 'center',
            borderRadius: 3,
            backgroundColor: 'rgba(69, 137, 255, 0.05)',
            border: '1px dashed rgba(69, 137, 255, 0.3)'
          }}
        >
          <Box 
            sx={{ 
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'rgba(69, 137, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              mb: 2
            }}
          >
            <PersonIcon sx={{ fontSize: 40, color: '#4589ff' }} />
          </Box>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Engineers Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Add your first engineer using the button above
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            sx={{ 
              borderRadius: 28,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Add New Engineer
          </Button>
        </Paper>
      )}
      
      {/* Engineer Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
          display: 'flex',
          alignItems: 'center'
        }}>
          <EngineeringIcon sx={{ mr: 1, color: 'primary.main' }} />
          {isEditMode ? 'Edit Engineer' : 'Add New Engineer'}
        </DialogTitle>
        <DialogContent dividers sx={{ borderTop: 'none', borderBottom: 'none', p: 3 }}>
          <TextField
            margin="dense"
            name="name"
            label="Engineer Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleFormChange}
            required
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            name="label"
            label="Label"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.label || ""}
            onChange={handleFormChange}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={!!formData.disableAssignment}
                onChange={handleCheckboxChange}
                name="disableAssignment"
              />
            }
            label="Disable Case Assignment"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              borderRadius: 28,
              px: 2,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEngineer} 
            variant="contained" 
            color="primary"
            sx={{ 
              borderRadius: 28,
              px: 3,
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            {isEditMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EngineerManagement; 
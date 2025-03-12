import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Container,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
  FormGroup
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useAppContext } from '../context/AppContext';
import { Silo, Engineer } from '../models/types';

const SiloManagement: React.FC = () => {
  const { silos, engineers, addSilo, updateSilo, removeSilo, updateEngineer } = useAppContext();
  
  // Dialog states
  const [openSiloDialog, setOpenSiloDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedSiloId, setSelectedSiloId] = useState<string>('');
  const [formData, setFormData] = useState<Partial<Silo>>({
    name: '',
    description: ''
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEngineers, setSelectedEngineers] = useState<Record<string, boolean>>({});
  
  // Add state for engineer labels
  const [engineerLabels, setEngineerLabels] = useState<Record<string, string>>({});
  const [editingLabelFor, setEditingLabelFor] = useState<string>('');
  
  // Handle silo dialog
  const handleOpenSiloDialog = (silo?: Silo) => {
    if (silo) {
      // Edit mode
      setFormData({
        ...silo
      });
      setIsEditMode(true);
    } else {
      // Add mode
      setFormData({
        name: '',
        description: ''
      });
      setIsEditMode(false);
    }
    setOpenSiloDialog(true);
  };
  
  const handleCloseSiloDialog = () => {
    setOpenSiloDialog(false);
  };
  
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSaveSilo = () => {
    if (!formData.name) {
      // Basic validation
      alert('Please enter a silo name');
      return;
    }
    
    if (isEditMode && formData.id) {
      // Update existing silo
      updateSilo(formData.id, formData);
    } else {
      // Add new silo
      addSilo(formData as Omit<Silo, 'id'>);
    }
    
    handleCloseSiloDialog();
  };
  
  // Handle assign engineers dialog
  const handleOpenAssignDialog = (siloId: string) => {
    setSelectedSiloId(siloId);
    
    // Initialize selected engineers based on current assignments
    const initialSelection: Record<string, boolean> = {};
    const initialLabels: Record<string, string> = {};
    
    engineers.forEach(engineer => {
      initialSelection[engineer.id] = engineer.siloIds.includes(siloId);
      // Get silo-specific label if it exists
      const key = `${engineer.id}:${siloId}`;
      initialLabels[key] = engineer.siloLabels?.[siloId] || '';
    });
    
    setSelectedEngineers(initialSelection);
    setEngineerLabels(initialLabels);
    setOpenAssignDialog(true);
  };
  
  const handleCloseAssignDialog = () => {
    setOpenAssignDialog(false);
    setSelectedSiloId('');
  };
  
  const handleEngineerSelectionChange = (engineerId: string, checked: boolean) => {
    setSelectedEngineers(prev => ({
      ...prev,
      [engineerId]: checked
    }));
  };
  
  const handleSaveAssignments = () => {
    // Update each engineer's siloIds and labels
    Object.entries(selectedEngineers).forEach(([engineerId, isSelected]) => {
      const engineer = engineers.find(e => e.id === engineerId);
      
      if (engineer) {
        const currentSiloIds = [...engineer.siloIds];
        const hasAssignment = currentSiloIds.includes(selectedSiloId);
        const key = `${engineerId}:${selectedSiloId}`;
        const label = engineerLabels[key] !== undefined ? engineerLabels[key] : '';
        
        // Create or update siloLabels
        const siloLabels = { ...(engineer.siloLabels || {}) };
        
        if (isSelected) {
          // Set the label for this silo
          siloLabels[selectedSiloId] = label;
        } else if (hasAssignment) {
          // Remove the label for this silo
          delete siloLabels[selectedSiloId];
        }
        
        if (isSelected && !hasAssignment) {
          // Add silo assignment with label
          updateEngineer(engineerId, { 
            siloIds: [...currentSiloIds, selectedSiloId],
            siloLabels
          });
        } else if (!isSelected && hasAssignment) {
          // Remove silo assignment and its label
          updateEngineer(engineerId, { 
            siloIds: currentSiloIds.filter(id => id !== selectedSiloId),
            siloLabels
          });
        } else if (isSelected && siloLabels[selectedSiloId] !== engineer.siloLabels?.[selectedSiloId]) {
          // Just update the label
          updateEngineer(engineerId, { siloLabels });
        }
      }
    });
    
    handleCloseAssignDialog();
  };
  
  const handleDeleteSilo = (id: string) => {
    if (window.confirm('Are you sure you want to delete this silo?')) {
      // Remove this silo from all engineers
      engineers.forEach(engineer => {
        if (engineer.siloIds.includes(id)) {
          updateEngineer(engineer.id, {
            siloIds: engineer.siloIds.filter(siloId => siloId !== id)
          });
        }
      });
      
      // Delete the silo
      removeSilo(id);
    }
  };
  
  const getEngineersInSilo = (siloId: string) => {
    return engineers.filter(engineer => engineer.siloIds.includes(siloId));
  };
  
  // Function to get a consistent color based on name
  const getSiloColor = (name: string): string => {
    const colors = [
      '#4589ff', // IBM Blue
      '#8a3ffc', // IBM Purple
      '#33b1ff', // IBM Cyan
      '#fa4d56', // IBM Red
      '#08bdba', // IBM Teal
      '#ff832b', // IBM Orange
      '#6fdc8c', // IBM Green
    ];
    
    // Simple hash function to get a consistent index
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  // Handle label change
  const handleLabelChange = (engineerId: string, siloId: string, label: string) => {
    const key = `${engineerId}:${siloId}`;
    setEngineerLabels({
      ...engineerLabels,
      [key]: label
    });
  };
  
  // Save the label to the engineer for the specific silo
  const handleSaveLabel = (engineerId: string, siloId: string) => {
    const engineer = engineers.find(e => e.id === engineerId);
    if (engineer) {
      const key = `${engineerId}:${siloId}`;
      // Use empty string if the label is undefined (completely deleted)
      const label = engineerLabels[key] !== undefined ? engineerLabels[key] : '';
      
      const siloLabels = { ...(engineer.siloLabels || {}) };
      siloLabels[siloId] = label;
      
      updateEngineer(engineerId, { siloLabels });
      setEditingLabelFor('');
    }
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
            <BusinessIcon sx={{ fontSize: 40 }} />
          </Box>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
              Silo Management
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9 }}>
              Manage silos and assign engineers to them
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenSiloDialog()}
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
          Add New Silo
        </Button>
      </Box>
      
      {/* Card-based Silo Layout */}
      {silos.length > 0 ? (
        <Grid container spacing={3}>
          {silos.map((silo) => {
            const siloEngineers = getEngineersInSilo(silo.id);
            const siloColor = getSiloColor(silo.name);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={silo.id}>
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
                      background: `linear-gradient(90deg, ${siloColor} 30%, #8a3ffc 100%)`
                    }} 
                  />
                  
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: siloColor,
                            mr: 1.5,
                            width: 40,
                            height: 40,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          <BusinessIcon />
                        </Avatar>
                        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                          {silo.name}
                        </Typography>
                      </Box>
                      <Box>
                        <Tooltip title="Edit Silo">
                          <IconButton 
                            onClick={() => handleOpenSiloDialog(silo)}
                            sx={{ 
                              mr: 0.5,
                              backgroundColor: 'rgba(69, 137, 255, 0.1)',
                              '&:hover': {
                                backgroundColor: 'rgba(69, 137, 255, 0.2)',
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Silo">
                          <IconButton 
                            onClick={() => handleDeleteSilo(silo.id)}
                            color="error"
                            sx={{ 
                              backgroundColor: 'rgba(250, 77, 86, 0.1)',
                              '&:hover': {
                                backgroundColor: 'rgba(250, 77, 86, 0.2)',
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    
                    {silo.description && (
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                        {silo.description}
                      </Typography>
                    )}
                    
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2,
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: 'rgba(69, 137, 255, 0.08)'
                      }}
                    >
                      <PeopleIcon sx={{ color: 'primary.main', mr: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {siloEngineers.length} {siloEngineers.length === 1 ? 'Engineer' : 'Engineers'} Assigned
                      </Typography>
                    </Box>
                    
                    {siloEngineers.length > 0 ? (
                      <List sx={{ p: 0 }}>
                        {siloEngineers.map((engineer) => {
                          // Get the label specific to this silo
                          const siloSpecificLabel = engineer.siloLabels?.[silo.id] || '';
                          const editKey = `${engineer.id}:${silo.id}`;
                          
                          return (
                            <ListItem 
                              key={engineer.id} 
                              sx={{ 
                                px: 1,
                                py: 1,
                                borderRadius: 2,
                                mb: 1,
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                }
                              }}
                            >
                              <Avatar 
                                sx={{ 
                                  width: 32, 
                                  height: 32, 
                                  mr: 1.5,
                                  bgcolor: 'primary.main',
                                  fontSize: '0.875rem'
                                }}
                              >
                                {engineer.name.charAt(0)}
                              </Avatar>
                              <ListItemText 
                                primary={engineer.name} 
                                primaryTypographyProps={{ fontWeight: 500 }}
                              />
                              
                              {editingLabelFor === editKey ? (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <TextField
                                    size="small"
                                    value={engineerLabels[editKey] !== undefined ? engineerLabels[editKey] : siloSpecificLabel}
                                    onChange={(e) => handleLabelChange(engineer.id, silo.id, e.target.value)}
                                    placeholder="Add label"
                                    variant="outlined"
                                    sx={{ 
                                      width: '120px',
                                      mr: 1,
                                      '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        height: 32,
                                        fontSize: '0.75rem'
                                      }
                                    }}
                                  />
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={() => handleSaveLabel(engineer.id, silo.id)}
                                    sx={{ 
                                      p: 0.5,
                                      backgroundColor: 'rgba(69, 137, 255, 0.1)'
                                    }}
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {siloSpecificLabel ? (
                                    <Chip 
                                      size="small" 
                                      label={siloSpecificLabel}
                                      sx={{ 
                                        height: 24,
                                        mr: 1,
                                        backgroundColor: 'rgba(69, 137, 255, 0.1)',
                                        color: 'primary.main',
                                        fontWeight: 500
                                      }}
                                    />
                                  ) : null}
                                  <IconButton 
                                    size="small" 
                                    onClick={() => {
                                      setEditingLabelFor(editKey);
                                      // Initialize with the current label
                                      setEngineerLabels({
                                        ...engineerLabels,
                                        [editKey]: siloSpecificLabel
                                      });
                                    }}
                                    sx={{ 
                                      p: 0.5,
                                      backgroundColor: 'rgba(69, 137, 255, 0.1)'
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              )}
                            </ListItem>
                          );
                        })}
                      </List>
                    ) : (
                      <Box 
                        sx={{ 
                          p: 2, 
                          textAlign: 'center', 
                          borderRadius: 2,
                          backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          border: '1px dashed rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          No engineers assigned to this silo
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  
                  <Divider />
                  
                  <CardActions sx={{ justifyContent: 'center', p: 2 }}>
                    <Button 
                      variant="contained"
                      startIcon={<PersonIcon />}
                      onClick={() => handleOpenAssignDialog(silo.id)}
                      sx={{ 
                        borderRadius: 28,
                        px: 2,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 500,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      Assign Engineers
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
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
            <BusinessIcon sx={{ fontSize: 40, color: '#4589ff' }} />
          </Box>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Silos Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Add your first silo using the button above
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenSiloDialog()}
            sx={{ 
              borderRadius: 28,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Add New Silo
          </Button>
        </Paper>
      )}
      
      {/* Silo Dialog */}
      <Dialog 
        open={openSiloDialog} 
        onClose={handleCloseSiloDialog} 
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
          <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
          {isEditMode ? 'Edit Silo' : 'Add New Silo'}
        </DialogTitle>
        <DialogContent dividers sx={{ borderTop: 'none', borderBottom: 'none', p: 3 }}>
          <TextField
            margin="dense"
            name="name"
            label="Silo Name"
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
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.description}
            onChange={handleFormChange}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
          <Button 
            onClick={handleCloseSiloDialog}
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
            onClick={handleSaveSilo} 
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
      
      {/* Assign Engineers Dialog */}
      <Dialog 
        open={openAssignDialog} 
        onClose={handleCloseAssignDialog} 
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
          <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
          Assign Engineers to Silo
        </DialogTitle>
        <DialogContent dividers sx={{ borderTop: 'none', borderBottom: 'none', p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select the engineers you want to assign to this silo. You can add a custom label for each engineer that will be specific to this silo.
          </Typography>
          
          <FormGroup>
            {engineers.filter(e => e.isActive).map(engineer => (
              <Box key={engineer.id} sx={{ mb: 2, pb: 2, borderBottom: '1px solid rgba(0, 0, 0, 0.06)' }}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={selectedEngineers[engineer.id] || false}
                      onChange={(e) => handleEngineerSelectionChange(engineer.id, e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          mr: 1,
                          fontSize: '0.75rem',
                          bgcolor: 'primary.main'
                        }}
                      >
                        {engineer.name.charAt(0)}
                      </Avatar>
                      <Typography variant="body1">
                        {engineer.name}
                      </Typography>
                    </Box>
                  }
                />
                
                {selectedEngineers[engineer.id] && (
                  <Box sx={{ pl: 4, mt: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Label for this silo only:
                    </Typography>
                    <TextField
                      size="small"
                      placeholder="E.g., Backup, Training, SEV 1 only"
                      value={engineerLabels[`${engineer.id}:${selectedSiloId}`] !== undefined ? 
                        engineerLabels[`${engineer.id}:${selectedSiloId}`] : ''}
                      onChange={(e) => handleLabelChange(engineer.id, selectedSiloId, e.target.value)}
                      sx={{ 
                        width: '100%',
                        maxWidth: '300px',
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2
                        }
                      }}
                    />
                  </Box>
                )}
              </Box>
            ))}
          </FormGroup>
          
          {engineers.filter(e => e.isActive).length === 0 && (
            <Box 
              sx={{ 
                p: 2, 
                textAlign: 'center', 
                borderRadius: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                border: '1px dashed rgba(0, 0, 0, 0.1)'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No active engineers available to assign
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
          <Button 
            onClick={handleCloseAssignDialog}
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
            onClick={handleSaveAssignments} 
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
            Save Assignments
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SiloManagement; 
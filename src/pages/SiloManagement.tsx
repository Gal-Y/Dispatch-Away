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
  const [engineerLabels, setEngineerLabels] = useState<Record<string, string[]>>({});
  const [currentLabelInput, setCurrentLabelInput] = useState<string>('');
  const [editingLabel, setEditingLabel] = useState<{ engineerId: string; siloId: string; index: number } | null>(null);
  const [editLabelValue, setEditLabelValue] = useState('');
  
  // Add this new state to track which engineer is getting a new label
  const [addingLabelFor, setAddingLabelFor] = useState<string | null>(null);
  
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
    const initialLabels: Record<string, string[]> = {};
    
    engineers.forEach(engineer => {
      initialSelection[engineer.id] = engineer.siloIds.includes(siloId);
      // Get silo-specific labels if they exist
      const siloLabels = engineer.siloLabels?.[siloId];
      initialLabels[`${engineer.id}:${siloId}`] = siloLabels ? 
        (Array.isArray(siloLabels) ? siloLabels : [siloLabels]) : [];
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
    // Create a map of engineer updates to batch process
    const engineerUpdates = new Map();
    
    // Process each engineer one by one
    for (const engineer of engineers) {
      const engineerId = engineer.id;
      const isSelected = selectedEngineers[engineerId] || false;
      const currentSiloIds = [...engineer.siloIds];
      const hasAssignment = currentSiloIds.includes(selectedSiloId);
      
      // Skip if no change is needed
      if (isSelected === hasAssignment && 
          (!isSelected || 
           (JSON.stringify(engineer.siloLabels?.[selectedSiloId]) === 
            JSON.stringify(engineerLabels[`${engineerId}:${selectedSiloId}`] || [])))) {
        continue;
      }
      
      // Create or update siloLabels
      const siloLabels = { ...(engineer.siloLabels || {}) };
      
      if (isSelected) {
        // Add or update labels
        const labels = engineerLabels[`${engineerId}:${selectedSiloId}`] || [];
        siloLabels[selectedSiloId] = labels;
        
        // Add silo if not already assigned
        if (!hasAssignment) {
          console.log(`Adding engineer ${engineer.name} to silo ${selectedSiloId}`);
          engineerUpdates.set(engineerId, {
            siloIds: [...currentSiloIds, selectedSiloId],
            siloLabels
          });
        } else {
          // Just update the labels
          console.log(`Updating labels for engineer ${engineer.name} in silo ${selectedSiloId}`);
          engineerUpdates.set(engineerId, { siloLabels });
        }
      } else if (hasAssignment) {
        // Remove silo and its labels
        delete siloLabels[selectedSiloId];
        console.log(`Removing engineer ${engineer.name} from silo ${selectedSiloId}`);
        engineerUpdates.set(engineerId, {
          siloIds: currentSiloIds.filter(id => id !== selectedSiloId),
          siloLabels
        });
      }
    }
    
    // Apply all updates at once
    if (engineerUpdates.size > 0) {
      console.log(`Applying updates for ${engineerUpdates.size} engineers`);
      
      // Call updateEngineer for each engineer that needs updating
      engineerUpdates.forEach((update, engineerId) => {
        updateEngineer(engineerId, update);
      });
    }
    
    // Close the dialog
    handleCloseAssignDialog();
  };
  
  const handleDeleteSilo = (id: string) => {
    if (window.confirm('Are you sure you want to delete this silo?')) {
      // Collect engineers that need updates
      const engineersToUpdate = engineers.filter(engineer => engineer.siloIds.includes(id));
      
      // Apply updates
      engineersToUpdate.forEach(engineer => {
        const siloLabels = { ...(engineer.siloLabels || {}) };
        delete siloLabels[id];
        
        updateEngineer(engineer.id, {
          siloIds: engineer.siloIds.filter(siloId => siloId !== id),
          siloLabels
        });
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
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentLabelInput(e.target.value);
  };
  
  // Toggle the label input field visibility
  const toggleLabelInput = (engineerId: string, siloId: string) => {
    const key = `${engineerId}:${siloId}`;
    setAddingLabelFor(prev => prev === key ? null : key);
    setCurrentLabelInput(''); // Clear input when toggling
  };
  
  // Update handleAddLabel to hide the input after adding
  const handleAddLabel = (engineerId: string, siloId: string) => {
    if (!currentLabelInput.trim()) return;
    
    const key = `${engineerId}:${siloId}`;
    const currentLabels = engineerLabels[key] || [];
    const newLabel = currentLabelInput.trim();
    
    // Don't add duplicate labels
    if (currentLabels.includes(newLabel)) {
      setCurrentLabelInput('');
      return;
    }
    
    const updatedLabels = [...currentLabels, newLabel];
    
    // Update local state
    setEngineerLabels(prevLabels => ({
      ...prevLabels,
      [key]: updatedLabels
    }));
    
    // Clear the input
    setCurrentLabelInput('');
    
    // Hide the input field after adding the label
    setAddingLabelFor(null);
    
    // Immediately save the updated labels to the engineer
    const engineer = engineers.find(e => e.id === engineerId);
    if (engineer) {
      const siloLabels = { ...(engineer.siloLabels || {}) };
      siloLabels[siloId] = updatedLabels;
      updateEngineer(engineerId, { siloLabels });
    }
  };
  
  // Remove a label
  const handleRemoveLabel = (engineerId: string, siloId: string, index: number) => {
    const key = `${engineerId}:${siloId}`;
    const currentLabels = engineerLabels[key] || [];
    
    if (index >= 0 && index < currentLabels.length) {
      const updatedLabels = [...currentLabels];
      updatedLabels.splice(index, 1);
      
      setEngineerLabels(prevLabels => ({
        ...prevLabels,
        [key]: updatedLabels
      }));
      
      // Immediately save the updated labels to the engineer
      const engineer = engineers.find(e => e.id === engineerId);
      if (engineer) {
        const siloLabels = { ...(engineer.siloLabels || {}) };
        siloLabels[siloId] = updatedLabels;
        updateEngineer(engineerId, { siloLabels });
      }
    }
  };
  
  // Remove engineer from silo
  const handleRemoveEngineerFromSilo = (engineerId: string, siloId: string) => {
    const engineer = engineers.find(e => e.id === engineerId);
    if (engineer) {
      const siloLabels = { ...(engineer.siloLabels || {}) };
      delete siloLabels[siloId];
      
      updateEngineer(engineerId, {
        siloIds: engineer.siloIds.filter(id => id !== siloId),
        siloLabels
      });
    }
  };
  
  // Start editing a label when double-clicked
  const handleStartEditLabel = (engineerId: string, siloId: string, index: number, currentValue: string) => {
    setEditingLabel({ engineerId, siloId, index });
    setEditLabelValue(currentValue);
  };
  
  // Save the edited label when Enter is pressed or field loses focus
  const handleSaveEditedLabel = () => {
    if (editingLabel) {
      const { engineerId, siloId, index } = editingLabel;
      const key = `${engineerId}:${siloId}`;
      const currentLabels = [...(engineerLabels[key] || [])];
      
      // If the label is empty, remove it
      if (editLabelValue.trim() === '') {
        handleRemoveLabel(engineerId, siloId, index);
      } else {
        // Otherwise update the label
        currentLabels[index] = editLabelValue.trim();
        
        setEngineerLabels(prevLabels => ({
          ...prevLabels,
          [key]: currentLabels
        }));
        
        // Immediately save the updated labels to the engineer
        const engineer = engineers.find(e => e.id === engineerId);
        if (engineer) {
          const siloLabels = { ...(engineer.siloLabels || {}) };
          siloLabels[siloId] = currentLabels;
          updateEngineer(engineerId, { siloLabels });
        }
      }
      
      // Clear editing state
      setEditingLabel(null);
      setEditLabelValue('');
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
                          // Get the labels specific to this silo - make sure to get fresh data
                          const siloSpecificLabels = engineer.siloLabels?.[silo.id] || [];
                          const labels = Array.isArray(siloSpecificLabels) ? siloSpecificLabels : [siloSpecificLabels];
                          const key = `${engineer.id}:${silo.id}`;
                          
                          console.log('Engineer:', engineer.name, 'silo:', silo.name, 'labels:', labels);
                          
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
                                },
                                pr: 12 // Add right padding for the action buttons
                              }}
                              secondaryAction={
                                <Box sx={{ display: 'flex' }}>
                                  <Tooltip title="Remove from silo">
                                    <IconButton 
                                      edge="end" 
                                      size="small"
                                      onClick={() => {
                                        if (window.confirm(`Remove ${engineer.name} from this silo?`)) {
                                          handleRemoveEngineerFromSilo(engineer.id, silo.id);
                                        }
                                      }}
                                      sx={{ 
                                        color: 'error.main',
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
                              }
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
                              
                              <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                minWidth: 200,
                                ml: 2
                              }}>
                                {addingLabelFor === `${engineer.id}:${silo.id}` ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <TextField
                                      size="small"
                                      value={currentLabelInput}
                                      onChange={handleLabelChange}
                                      placeholder="Add label"
                                      variant="outlined"
                                      autoFocus
                                      sx={{ 
                                        width: '100%',
                                        mr: 1,
                                        '& .MuiOutlinedInput-root': {
                                          borderRadius: 2,
                                          height: 32,
                                          fontSize: '0.75rem',
                                          backgroundColor: 'white',
                                          color: '#0050E6',
                                          '& fieldset': {
                                            borderColor: '#CCE0FF',
                                          },
                                          '&:hover fieldset': {
                                            borderColor: '#BBDBFF',
                                          },
                                          '&.Mui-focused fieldset': {
                                            borderColor: '#0050E6',
                                          }
                                        },
                                        '& .MuiInputBase-input::placeholder': {
                                          color: '#5D91FF',
                                          opacity: 0.7
                                        }
                                      }}
                                      onKeyPress={(e: React.KeyboardEvent<HTMLDivElement>) => {
                                        if (e.key === 'Enter') {
                                          handleAddLabel(engineer.id, silo.id);
                                        }
                                      }}
                                    />
                                    <IconButton 
                                      size="small" 
                                      color="primary"
                                      onClick={() => handleAddLabel(engineer.id, silo.id)}
                                      sx={{ 
                                        p: 0.5,
                                        backgroundColor: '#EAF2FF',
                                        border: '1px solid #CCE0FF',
                                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                        '&:hover': {
                                          backgroundColor: '#D8E8FF',
                                        }
                                      }}
                                    >
                                      <AddIcon fontSize="small" sx={{ color: '#0050E6' }} />
                                    </IconButton>
                                  </Box>
                                ) : (
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    onClick={() => toggleLabelInput(engineer.id, silo.id)}
                                    sx={{ 
                                      p: 0.5,
                                      mb: 1,
                                      alignSelf: 'flex-start',
                                      backgroundColor: '#EAF2FF',
                                      border: '1px solid #CCE0FF',
                                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                      '&:hover': {
                                        backgroundColor: '#D8E8FF',
                                      }
                                    }}
                                  >
                                    <AddIcon fontSize="small" sx={{ color: '#0050E6' }} />
                                  </IconButton>
                                )}
                                
                                {/* Labels display */}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {(engineerLabels[`${engineer.id}:${silo.id}`] || labels).map((label, index) => {
                                    const isEditing = editingLabel && 
                                                     editingLabel.engineerId === engineer.id && 
                                                     editingLabel.siloId === silo.id && 
                                                     editingLabel.index === index;
                                    
                                    return isEditing ? (
                                      <TextField
                                        key={index}
                                        size="small"
                                        autoFocus
                                        value={editLabelValue}
                                        onChange={(e) => setEditLabelValue(e.target.value)}
                                        variant="outlined"
                                        sx={{ 
                                          width: '120px',
                                          '& .MuiOutlinedInput-root': {
                                            borderRadius: 2,
                                            height: 28,
                                            fontSize: '0.75rem',
                                            backgroundColor: 'white',
                                            color: '#0050E6',
                                            '& fieldset': {
                                              borderColor: '#CCE0FF',
                                            },
                                            '&:hover fieldset': {
                                              borderColor: '#BBDBFF',
                                            },
                                            '&.Mui-focused fieldset': {
                                              borderColor: '#0050E6',
                                            }
                                          }
                                        }}
                                        onKeyPress={(e: React.KeyboardEvent<HTMLDivElement>) => {
                                          if (e.key === 'Enter') {
                                            handleSaveEditedLabel();
                                          }
                                        }}
                                        onBlur={handleSaveEditedLabel}
                                      />
                                    ) : (
                                      <Chip 
                                        key={index}
                                        size="small" 
                                        label={label}
                                        onDoubleClick={() => handleStartEditLabel(engineer.id, silo.id, index, label)}
                                        onDelete={() => handleRemoveLabel(engineer.id, silo.id, index)}
                                        sx={{ 
                                          height: 28,
                                          borderRadius: '14px',
                                          backgroundColor: '#EAF2FF',
                                          color: '#0050E6',
                                          fontWeight: 500,
                                          border: '1px solid #CCE0FF',
                                          marginBottom: 0.5,
                                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                          '& .MuiChip-label': {
                                            px: 1.5,
                                          },
                                          '& .MuiChip-deleteIcon': {
                                            color: '#5D91FF',
                                            '&:hover': {
                                              color: '#0050E6',
                                            },
                                          },
                                          '&:hover': {
                                            backgroundColor: '#D8E8FF',
                                            border: '1px solid #BBDBFF',
                                          }
                                        }}
                                      />
                                    );
                                  })}
                                </Box>
                              </Box>
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
                      Labels for this silo:
                    </Typography>
                    
                    {addingLabelFor === `${engineer.id}:${selectedSiloId}` ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <TextField
                          size="small"
                          placeholder="E.g., Backup, Training, SEV 1 only"
                          value={currentLabelInput}
                          onChange={handleLabelChange}
                          autoFocus
                          sx={{ 
                            width: '100%',
                            maxWidth: '300px',
                            mr: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: 'white',
                              color: '#0050E6',
                              '& fieldset': {
                                borderColor: '#CCE0FF',
                              },
                              '&:hover fieldset': {
                                borderColor: '#BBDBFF',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: '#0050E6',
                              }
                            },
                            '& .MuiInputBase-input::placeholder': {
                              color: '#5D91FF',
                              opacity: 0.7
                            }
                          }}
                          onKeyPress={(e: React.KeyboardEvent<HTMLDivElement>) => {
                            if (e.key === 'Enter') {
                              handleAddLabel(engineer.id, selectedSiloId);
                            }
                          }}
                        />
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleAddLabel(engineer.id, selectedSiloId)}
                          sx={{ 
                            p: 0.5,
                            backgroundColor: '#EAF2FF',
                            border: '1px solid #CCE0FF',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                            '&:hover': {
                              backgroundColor: '#D8E8FF',
                            }
                          }}
                        >
                          <AddIcon fontSize="small" sx={{ color: '#0050E6' }} />
                        </IconButton>
                      </Box>
                    ) : (
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => toggleLabelInput(engineer.id, selectedSiloId)}
                        sx={{ 
                          p: 0.5,
                          mb: 1,
                          backgroundColor: '#EAF2FF',
                          border: '1px solid #CCE0FF',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                          '&:hover': {
                            backgroundColor: '#D8E8FF',
                          }
                        }}
                      >
                        <AddIcon fontSize="small" sx={{ color: '#0050E6' }} />
                      </IconButton>
                    )}
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: '300px' }}>
                      {(engineerLabels[`${engineer.id}:${selectedSiloId}`] || []).map((label, index) => {
                        const isEditing = editingLabel && 
                                         editingLabel.engineerId === engineer.id && 
                                         editingLabel.siloId === selectedSiloId && 
                                         editingLabel.index === index;
                        
                        return isEditing ? (
                          <TextField
                            key={index}
                            size="small"
                            autoFocus
                            value={editLabelValue}
                            onChange={(e) => setEditLabelValue(e.target.value)}
                            variant="outlined"
                            sx={{ 
                              width: '120px',
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                                height: 28,
                                fontSize: '0.75rem',
                                backgroundColor: 'white',
                                color: '#0050E6',
                                '& fieldset': {
                                  borderColor: '#CCE0FF',
                                },
                                '&:hover fieldset': {
                                  borderColor: '#BBDBFF',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#0050E6',
                                }
                              }
                            }}
                            onKeyPress={(e: React.KeyboardEvent<HTMLDivElement>) => {
                              if (e.key === 'Enter') {
                                handleSaveEditedLabel();
                              }
                            }}
                            onBlur={handleSaveEditedLabel}
                          />
                        ) : (
                          <Chip 
                            key={index}
                            size="small" 
                            label={label}
                            onDoubleClick={() => handleStartEditLabel(engineer.id, selectedSiloId, index, label)}
                            onDelete={() => handleRemoveLabel(engineer.id, selectedSiloId, index)}
                            sx={{ 
                              height: 28,
                              borderRadius: '14px',
                              backgroundColor: '#EAF2FF',
                              color: '#0050E6',
                              fontWeight: 500,
                              border: '1px solid #CCE0FF',
                              marginBottom: 0.5,
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                              '& .MuiChip-label': {
                                px: 1.5,
                              },
                              '& .MuiChip-deleteIcon': {
                                color: '#5D91FF',
                                '&:hover': {
                                  color: '#0050E6',
                                },
                              },
                              '&:hover': {
                                backgroundColor: '#D8E8FF',
                                border: '1px solid #BBDBFF',
                              }
                            }}
                          />
                        );
                      })}
                    </Box>
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
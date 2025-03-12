import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { DateRange as DateRangeIcon } from '@mui/icons-material';
import { useAppContext } from '../../context/AppContext';

// Define interfaces for our data
interface RosterEntry {
  id: string;
  engineerId: string;
  date: string; // ISO string
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

// Helper functions to replace date-fns
const formatDate = (date: Date, format: string = 'yyyy-MM-dd'): string => {
  if (format === 'yyyy-MM-dd') {
    return date.toISOString().split('T')[0];
  }
  
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();
  
  if (format === 'MMM d, yyyy') {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${day}, ${year}`;
  }
  
  return `${month}/${day}/${year}`;
};

const addDaysToDate = (date: Date, days: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

const getStartOfWeek = (date: Date): Date => {
  const newDate = new Date(date);
  // Reset time component to ensure consistent behavior
  newDate.setHours(0, 0, 0, 0);
  const day = newDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
  
  // Calculate how many days to subtract to get to Monday
  // If today is Sunday (0), we need to go back 6 days
  // If today is Monday (1), we need to go back 0 days
  // If today is Tuesday (2), we need to go back 1 day, etc.
  const daysToSubtract = day === 0 ? 6 : day - 1;
  
  // Subtract the days to get to Monday
  newDate.setDate(newDate.getDate() - daysToSubtract);
  
  return newDate;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// Add a function to get week number
const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

const TemporaryRoster: React.FC = () => {
  const { engineers } = useAppContext();
  
  // State for roster data
  const [rosterEntries, setRosterEntries] = useState<RosterEntry[]>(() => {
    const savedEntries = localStorage.getItem('temporaryRosterEntries');
    return savedEntries ? JSON.parse(savedEntries) : [];
  });
  
  // State for the currently selected week - always set to current week
  const [weekStart, setWeekStart] = useState<Date>(getStartOfWeek(new Date()));
  
  // Calculate week number and date range for display
  const weekNumber = getWeekNumber(weekStart);
  const weekYear = weekStart.getFullYear();
  const weekEnd = addDaysToDate(weekStart, 4); // Friday is 4 days after Monday
  const dateRangeText = `${formatDate(weekStart, 'MMM d')} - ${formatDate(weekEnd, 'MMM d')}, ${weekYear}`;
  
  // State for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<RosterEntry | null>(null);
  const [formData, setFormData] = useState({
    engineerId: '',
    date: formatDate(new Date()),
    startTime: '08:00',
    endTime: '16:30'
  });
  
  // Time slots for the roster (from 8:00 AM to 4:30 PM in 30-minute increments)
  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = 8 + Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });
  
  // Days of the week
  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Save roster entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('temporaryRosterEntries', JSON.stringify(rosterEntries));
  }, [rosterEntries]);
  
  // Generate dates for the week based on the weekStart date
  const weekDates = weekDays.map((_, i) => addDaysToDate(weekStart, i));
  
  // Handle dialog open for adding a new entry
  const handleAddEntry = () => {
    setEditingEntry(null);
    setFormData({
      engineerId: '',
      date: formatDate(weekStart),
      startTime: '08:00',
      endTime: '16:30'
    });
    setDialogOpen(true);
  };
  
  // Handle dialog open for editing an existing entry
  const handleEditEntry = (entry: RosterEntry) => {
    setEditingEntry(entry);
    setFormData({
      engineerId: entry.engineerId,
      date: formatDate(new Date(entry.date)),
      startTime: entry.startTime,
      endTime: entry.endTime
    });
    setDialogOpen(true);
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  
  // Handle form field changes
  const handleFormChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };
  
  // Handle save entry
  const handleSaveEntry = () => {
    const newEntry: RosterEntry = {
      id: editingEntry ? editingEntry.id : `entry_${Date.now()}`,
      engineerId: formData.engineerId,
      date: new Date(formData.date).toISOString(),
      startTime: formData.startTime,
      endTime: formData.endTime
    };
    
    if (editingEntry) {
      // Update existing entry
      setRosterEntries(prevEntries => 
        prevEntries.map(entry => entry.id === newEntry.id ? newEntry : entry)
      );
    } else {
      // Add new entry
      setRosterEntries(prevEntries => [...prevEntries, newEntry]);
    }
    
    setDialogOpen(false);
  };
  
  // Handle delete entry
  const handleDeleteEntry = (entryId: string) => {
    if (window.confirm('Are you sure you want to remove this engineer from the roster?')) {
      setRosterEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
    }
  };
  
  // Get entries for a specific day and time
  const getEntriesForTimeSlot = (date: Date, timeSlot: string) => {
    return rosterEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return isSameDay(entryDate, date) && 
             isTimeInRange(timeSlot, entry.startTime, entry.endTime);
    });
  };
  
  // Check if a time is within a range
  const isTimeInRange = (time: string, startTime: string, endTime: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const timeValue = hour * 60 + minute;
    const startValue = startHour * 60 + startMinute;
    const endValue = endHour * 60 + endMinute;
    
    return timeValue >= startValue && timeValue < endValue;
  };
  
  // Get engineer name by ID
  const getEngineerName = (engineerId: string) => {
    const engineer = engineers.find(eng => eng.id === engineerId);
    return engineer ? engineer.name : 'Unknown';
  };
  
  return (
    <Box>
      {/* Week indicator and date range - copied exactly from WeeklyView */}
      <Box sx={{ 
        mb: 2, 
        p: 1.5, 
        backgroundColor: 'background.paper', 
        width: '100%', 
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            backgroundColor: 'primary.main', 
            borderRadius: '50%', 
            width: 40, 
            height: 40, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mr: 2
          }}>
            <DateRangeIcon sx={{ color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Week {weekNumber}, {weekYear}
            </Typography>
            <Typography variant="body1">
              {dateRangeText}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        px: 2,
        pt: 2
      }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
          Temporary Dispatching Roster
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleAddEntry}
        >
          Add Engineer to Roster
        </Button>
      </Box>
      
      <Paper sx={{ mx: 2, mb: 4 }}>
        <TableContainer sx={{ overflow: 'auto', maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 100 }}>Time</TableCell>
                {weekDates.map((date, index) => (
                  <TableCell key={index} align="center" sx={{ minWidth: 150 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {weekDays[index]}
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(date, 'MMM d, yyyy')}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {timeSlots.map((timeSlot, timeIndex) => (
                <TableRow key={timeIndex} sx={{ 
                  '&:nth-of-type(odd)': { backgroundColor: 'rgba(0, 0, 0, 0.03)' },
                  '&:last-child td, &:last-child th': { border: 0 }
                }}>
                  <TableCell component="th" scope="row">
                    {timeSlot}
                  </TableCell>
                  {weekDates.map((date, dateIndex) => {
                    const entries = getEntriesForTimeSlot(date, timeSlot);
                    return (
                      <TableCell key={dateIndex} align="center" sx={{ 
                        backgroundColor: entries.length > 0 ? 'rgba(69, 137, 255, 0.1)' : undefined,
                        position: 'relative',
                        height: '60px',
                        '&:hover': {
                          backgroundColor: entries.length > 0 ? 'rgba(69, 137, 255, 0.2)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      }}>
                        {entries.map((entry, entryIndex) => (
                          <Box key={entryIndex} sx={{ 
                            p: 1, 
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: entries.length > 1 && entryIndex < entries.length - 1 ? 1 : 0,
                            backgroundColor: '#EAF2FF',
                            border: '1px solid #CCE0FF',
                          }}>
                            <Typography 
                              variant="body2" 
                              color="#0050E6" 
                              fontWeight="medium"
                              sx={{ flex: 1 }}
                            >
                              {getEngineerName(entry.engineerId)}
                            </Typography>
                            <Box>
                              <Tooltip title="Edit">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleEditEntry(entry)}
                                  sx={{ 
                                    p: 0.5,
                                    color: '#0050E6'
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Remove">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleDeleteEntry(entry.id)}
                                  sx={{ 
                                    p: 0.5,
                                    color: '#fa4d56'
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        ))}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingEntry ? 'Edit Roster Entry' : 'Add Engineer to Roster'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="engineer-select-label">Engineer</InputLabel>
              <Select
                labelId="engineer-select-label"
                value={formData.engineerId}
                label="Engineer"
                onChange={(e) => handleFormChange('engineerId', e.target.value)}
              >
                {engineers.filter(e => e.isActive).map((engineer) => (
                  <MenuItem key={engineer.id} value={engineer.id}>
                    {engineer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => handleFormChange('date', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ mb: 2 }}
            />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleFormChange('startTime', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 1800 }} // 30 min steps
                  fullWidth
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="End Time"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleFormChange('endTime', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ step: 1800 }} // 30 min steps
                  fullWidth
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveEntry} 
            variant="contained" 
            color="primary" 
            disabled={!formData.engineerId}
          >
            {editingEntry ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemporaryRoster; 
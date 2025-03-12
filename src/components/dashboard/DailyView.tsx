import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Tabs, 
  Tab, 
  Card, 
  CardContent, 
  CardHeader,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Divider,
  Badge,
  Stack,
  Collapse,
  List,
  ListItem,
  ListItemText,
  InputAdornment,
  FormHelperText
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as PendingIcon,
  Error as ErrorIcon,
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon,
  PriorityHigh as PriorityHighIcon,
  DateRange as DateRangeIcon,
  Numbers as NumbersIcon
} from '@mui/icons-material';
import { format, startOfWeek, addDays, parseISO, getWeek, getYear, isSameMonth } from 'date-fns';
import { useAppContext } from '../../context/AppContext';
import { Case, Silo } from '../../models/types';

// Priority and status styling
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Critical':
      return '#fa4d56'; // IBM Red
    case 'High':
      return '#ff832b'; // IBM Orange
    case 'Medium':
      return '#f1c21b'; // IBM Yellow
    case 'Low':
      return '#42be65'; // IBM Green
    default:
      return '#4589ff'; // IBM Blue
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'New':
      return '#4589ff'; // IBM Blue
    case 'In Progress':
      return '#8a3ffc'; // IBM Purple
    case 'Waiting':
      return '#ff832b'; // IBM Orange
    case 'Resolved':
      return '#42be65'; // IBM Green
    case 'Closed':
      return '#6f6f6f'; // IBM Gray
    default:
      return '#4589ff'; // IBM Blue
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'New':
      return <AssignmentIcon fontSize="small" />;
    case 'In Progress':
      return <PendingIcon fontSize="small" />;
    case 'Waiting':
      return <WarningIcon fontSize="small" />;
    case 'Resolved':
      return <CheckCircleIcon fontSize="small" />;
    case 'Closed':
      return <ErrorIcon fontSize="small" />;
    default:
      return <AssignmentIcon fontSize="small" />;
  }
};

// Function to check if a case is critical (Severity 1)
const isCriticalCase = (caseItem: Case): boolean => {
  return caseItem.priority === 'Critical';
};

const DailyView: React.FC = () => {
  const { 
    engineers, 
    cases,
    silos,
    getDailyCases, 
    addCase, 
    updateCase, 
    removeCase, 
    assignCase 
  } = useAppContext();
  
  // Get the current Monday
  const getMonday = (d: Date): Date => {
    const dateCopy = new Date(d);
    const day = dateCopy.getDay();
    const diff = dateCopy.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    dateCopy.setDate(diff);
    return dateCopy;
  };
  
  const today = new Date();
  const monday = getMonday(today);
  // If today is a weekday (Mon-Fri), use today; otherwise, default to Monday
  const defaultDate = today.getDay() >= 1 && today.getDay() <= 5 ? today : monday;
  // Calculate the index for the tabs based on the difference in day numbers
  const defaultTabIndex = defaultDate.getDate() - monday.getDate();
  const [selectedDate, setSelectedDate] = useState<Date>(defaultDate);
  const [selectedTabIndex, setSelectedTabIndex] = useState(defaultTabIndex);
  const [dailyCases, setDailyCases] = useState<Record<string, Case[]>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Case count state
  const [engineerCaseCounts, setEngineerCaseCounts] = useState<Record<string, Record<string, number>>>({});
  const [openCaseCountDialog, setOpenCaseCountDialog] = useState(false);
  const [caseCountFormData, setCaseCountFormData] = useState<Record<string, string>>({});
  
  // Dialog states
  const [openCaseDialog, setOpenCaseDialog] = useState(false);
  const [caseFormData, setCaseFormData] = useState<Partial<Case>>({
    caseNumber: '',
    priority: undefined,
    assignedTo: null
  });
  const [selectedSilo, setSelectedSilo] = useState<string>('');
  const [filteredEngineers, setFilteredEngineers] = useState<typeof engineers>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFromEngineerCard, setIsFromEngineerCard] = useState(false);
  
  // Generate dates for the tabs (Monday to Friday)
  const dates = Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  
  // Get date range string (e.g., "March 10 - March 14")
  const getDateRangeString = () => {
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    if (isSameMonth(firstDate, lastDate)) {
      return `${format(firstDate, 'MMMM d')} - ${format(lastDate, 'd, yyyy')}`;
    } else {
      return `${format(firstDate, 'MMMM d')} - ${format(lastDate, 'MMMM d, yyyy')}`;
    }
  };
  
  // Get week number
  const getWeekNumber = () => {
    return `Week ${getWeek(dates[0])}, ${getYear(dates[0])}`;
  };
  
  useEffect(() => {
    // Get the ISO date string for the selected date
    const dateString = selectedDate.toISOString().split('T')[0];
    
    // Get cases for the selected date
    const casesForDate = getDailyCases(dateString);
    setDailyCases(casesForDate);
    
    // Initialize expanded sections
    const initialExpandedState: Record<string, boolean> = {};
    engineers.forEach(engineer => {
      initialExpandedState[`${engineer.id}-critical`] = true;
      initialExpandedState[`${engineer.id}-normal`] = true;
    });
    
    setExpandedSections(initialExpandedState);
  }, [selectedDate, getDailyCases, engineers, cases]);
  
  // Update filtered engineers when silo changes
  useEffect(() => {
    if (selectedSilo) {
      setFilteredEngineers(engineers.filter(e => e.isActive && e.siloIds.includes(selectedSilo)));
    } else {
      setFilteredEngineers(engineers.filter(e => e.isActive));
    }
  }, [selectedSilo, engineers]);
  
  // Refresh daily cases whenever cases list changes
  useEffect(() => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      const casesForDate = getDailyCases(dateString);
      setDailyCases(casesForDate);
    }
  }, [cases, selectedDate, getDailyCases]);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTabIndex(newValue);
    setSelectedDate(dates[newValue]);
  };
  
  const handleToggleExpand = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
  const handleOpenCaseDialog = (caseItem?: Case) => {
    setIsFromEngineerCard(false);
    if (caseItem) {
      // Edit mode - include all necessary fields
      setIsEditMode(true);
      setCaseFormData({
        id: caseItem.id,
        caseNumber: caseItem.caseNumber,
        // Explicitly handle description to avoid null/undefined issues
        description: caseItem.description || '',
        priority: caseItem.priority,
        status: caseItem.status,
        assignedTo: caseItem.assignedTo,
        // Keep date references for proper record keeping
        dateCreated: caseItem.dateCreated,
        dateAssigned: caseItem.dateAssigned
      });
      
      // Set the silo if the engineer is assigned
      if (caseItem.assignedTo) {
        const engineer = engineers.find(e => e.id === caseItem.assignedTo);
        if (engineer && engineer.siloIds && engineer.siloIds.length > 0) {
          setSelectedSilo(engineer.siloIds[0]);
        }
      }
    } else {
      // Add mode - set explicit empty string for description
      setIsEditMode(false);
      setCaseFormData({
        caseNumber: '',
        priority: undefined,
        assignedTo: null,
        status: 'New',
        description: '' // Explicitly initialize with empty string
      });
      setSelectedSilo('');
    }
    setOpenCaseDialog(true);
  };
  
  const handleCloseCaseDialog = () => {
    setOpenCaseDialog(false);
    setSelectedSilo('');
    setIsFromEngineerCard(false);
  };
  
  const handleCaseFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setCaseFormData({
      ...caseFormData,
      [name as string]: value
    });
  };
  
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setCaseFormData({
      ...caseFormData,
      [name]: value
    });
  };
  
  const handleSiloChange = (e: SelectChangeEvent) => {
    setSelectedSilo(e.target.value);
    
    // Only reset engineer selection when silo changes if NOT opened from engineer card
    if (!isFromEngineerCard) {
      setCaseFormData(prev => ({
        ...prev,
        assignedTo: null
      }));
    }
  };
  
  const handleSaveCase = () => {
    console.log('Case form data:', caseFormData);
    console.log('Selected date:', selectedDate);

    // Validate required fields
    if (!caseFormData.caseNumber) {
      alert('Please enter a case number');
      return;
    }
    
    if (!caseFormData.priority) {
      alert('Please select a severity');
      return;
    }
    
    if (!caseFormData.assignedTo) {
      alert('Please assign this case to an engineer');
      return;
    }
    
    // Get the ISO date string for the selected date
    const dateString = selectedDate.toISOString().split('T')[0];
    
    if (isEditMode && caseFormData.id) {
      console.log('Editing existing case:', caseFormData.id);
      
      // First retrieve the existing case to ensure we have all fields
      const existingCase = cases.find(c => c.id === caseFormData.id);
      
      if (!existingCase) {
        console.error('Could not find case to update');
        return;
      }
      
      // Create a complete case object with all required fields
      const updatedCase: Case = {
        ...existingCase,
        caseNumber: caseFormData.caseNumber,
        // Handle description explicitly to avoid null/undefined issues
        description: caseFormData.description === undefined ? existingCase.description : caseFormData.description,
        priority: caseFormData.priority || existingCase.priority,
        assignedTo: caseFormData.assignedTo
      };
      
      console.log('Before update - case:', existingCase);
      console.log('After update - case:', updatedCase);
      
      // Update the case in the global state
      updateCase(caseFormData.id, updatedCase);
      
      // If engineer changed, update the assignment
      if (caseFormData.assignedTo !== existingCase.assignedTo) {
        assignCase(caseFormData.id, caseFormData.assignedTo, dateString);
      }
      
      // IMPORTANT: Directly update the local state to avoid UI flicker
      // Create an updated dailyCases object with the new case information
      const updatedDailyCases = { ...dailyCases };
      
      // Remove the case from its previous engineer if needed
      if (existingCase.assignedTo && existingCase.assignedTo !== updatedCase.assignedTo) {
        const previousEngineerCases = updatedDailyCases[existingCase.assignedTo] || [];
        updatedDailyCases[existingCase.assignedTo] = previousEngineerCases.filter(
          c => c.id !== existingCase.id
        );
      }
      
      // Add or update the case for the current engineer
      if (updatedCase.assignedTo) {
        // Get the current cases for this engineer or initialize an empty array
        const engineerCases = updatedDailyCases[updatedCase.assignedTo] || [];
        
        // Check if the case already exists for this engineer
        const existingCaseIndex = engineerCases.findIndex(c => c.id === updatedCase.id);
        
        if (existingCaseIndex >= 0) {
          // Update the existing case
          engineerCases[existingCaseIndex] = updatedCase;
        } else {
          // Add the case to this engineer's list
          engineerCases.push(updatedCase);
        }
        
        // Update the dailyCases state with the updated engineer cases
        updatedDailyCases[updatedCase.assignedTo] = engineerCases;
      }
      
      // Update the local state
      setDailyCases(updatedDailyCases);
      console.log('Updated dailyCases directly:', updatedDailyCases);
      
      // Close the dialog
      handleCloseCaseDialog();
      
    } else {
      // Creating a new case
      console.log('Creating new case with assignedTo:', caseFormData.assignedTo);
      
      // Create a clean case object - no redundant fields
      const newCase = {
        caseNumber: caseFormData.caseNumber,
        description: caseFormData.description || '',
        priority: caseFormData.priority,
        status: 'New',
        assignedTo: caseFormData.assignedTo,
        dateCreated: new Date().toISOString(),
        dateAssigned: dateString
      } as Omit<Case, 'id'>;
      
      console.log('Adding new case:', newCase);
      
      // Close the dialog immediately to improve UX
      handleCloseCaseDialog();
      
      // Add the case to global context
      addCase(newCase);
    }
  };
  
  // Case count dialog functions
  const handleOpenCaseCountDialog = () => {
    const dateString = selectedDate.toISOString().split('T')[0];
    const initialCounts: Record<string, string> = {};
    engineers.filter(engineer => engineer.isActive).forEach(engineer => {
      initialCounts[engineer.id] = engineerCaseCounts[dateString]?.[engineer.id]?.toString() || "";
    });
    
    setCaseCountFormData(initialCounts);
    setOpenCaseCountDialog(true);
  };
  
  const handleCloseCaseCountDialog = () => {
    setOpenCaseCountDialog(false);
  };
  
  const handleCaseCountChange = (engineerId: string, value: string) => {
    setCaseCountFormData(prev => ({
      ...prev,
      [engineerId]: value
    }));
  };
  
  const handleSaveCaseCounts = () => {
    // Convert string values to numbers
    const newCounts: Record<string, number> = {};
    
    Object.entries(caseCountFormData).forEach(([engineerId, countStr]) => {
      if (countStr === "") {
        newCounts[engineerId] = 0;
      } else {
        const count = parseInt(countStr);
        if (!isNaN(count) && count >= 0) {
          newCounts[engineerId] = count;
        }
      }
    });
    
    const dateString = selectedDate.toISOString().split('T')[0];
    setEngineerCaseCounts(prev => ({
      ...prev,
      [dateString]: newCounts
    }));
    handleCloseCaseCountDialog();
  };
  
  const handleDeleteCase = (id: string) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      removeCase(id);
    }
  };
  
  const getEngineerName = (id: string | null) => {
    if (!id) return 'Unassigned';
    const engineer = engineers.find(e => e.id === id);
    return engineer ? engineer.name : 'Unknown';
  };

  // Get silo name by ID
  const getSiloName = (siloId: string): string => {
    const silo = silos.find((s: Silo) => s.id === siloId);
    return silo ? silo.name : 'No Silo';
  };
  
  // Format date for display
  const formatDateForDisplay = (date: Date) => {
    return format(date, 'EEE, MMM d');
  };
  
  // Get the total number of cases for a date
  const getTotalCasesCount = () => {
    let total = 0;
    Object.values(dailyCases).forEach(caseArray => {
      total += caseArray.length;
    });
    return total;
  };
  
  // Get critical and normal cases for an engineer
  const getCriticalCases = (engineerId: string): Case[] => {
    if (!dailyCases[engineerId]) return [];
    return dailyCases[engineerId].filter(caseItem => isCriticalCase(caseItem));
  };
  
  const getNormalCases = (engineerId: string): Case[] => {
    if (!dailyCases[engineerId]) return [];
    return dailyCases[engineerId].filter(caseItem => !isCriticalCase(caseItem));
  };
  
  // Get total case count for an engineer (from state)
  const getTotalCaseCount = (engineerId: string): number => {
    const dashboardCases = (dailyCases[engineerId] || []).length;
    const dateString = selectedDate.toISOString().split('T')[0];
    const startingCases = engineerCaseCounts[dateString]?.[engineerId] || 0;
    return dashboardCases + startingCases;
  };
  
  // Render a case card
  const renderCaseCard = (caseItem: Case) => {
    // Convert priority to severity number
    const getSeverityNumber = (priority: string): string => {
      switch (priority) {
        case 'Critical': return 'SEV 1';
        case 'High': return 'SEV 2';
        case 'Medium': return 'SEV 3';
        case 'Low': return 'SEV 4';
        default: return 'SEV 3';
      }
    };

    return (
      <Card 
        key={caseItem.id} 
        sx={{ 
          m: 0.75, 
          mb: 1,
          backgroundColor: isCriticalCase(caseItem) ? 'rgba(0, 0, 0, 0.06)' : 'background.paper',
          position: 'relative',
          '&:last-child': {
            mb: 1
          },
          border: 'none',
          borderRadius: 2,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.1)',
          }
        }}
      >
        <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', fontSize: '0.8rem' }}>
              {isCriticalCase(caseItem) && (
                <PriorityHighIcon sx={{ mr: 0.5, color: '#fa4d56', fontSize: 'small' }} />
              )}
              {caseItem.caseNumber}
            </Typography>
            <Chip 
              label={getSeverityNumber(caseItem.priority)}
              size="small"
              sx={{ 
                backgroundColor: getPriorityColor(caseItem.priority),
                color: '#fff',
                fontWeight: 500,
                height: '20px',
                fontSize: '0.7rem',
                borderRadius: '10px'
              }}
            />
          </Box>
          
          {caseItem.description && (
            <Typography variant="body2" sx={{ mb: 0.75, fontSize: '0.75rem' }}>
              {caseItem.description}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 0.75 }}>
            <IconButton 
              size="small" 
              onClick={() => handleOpenCaseDialog(caseItem)}
              sx={{ 
                mr: 0.5, 
                padding: '4px',
                backgroundColor: 'rgba(69, 137, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(69, 137, 255, 0.2)',
                }
              }}
            >
              <EditIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => handleDeleteCase(caseItem.id)}
              color="error"
              sx={{ 
                padding: '4px',
                backgroundColor: 'rgba(250, 77, 86, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(250, 77, 86, 0.2)',
                }
              }}
            >
              <DeleteIcon sx={{ fontSize: '0.9rem' }} />
            </IconButton>
          </Box>
        </CardContent>
      </Card>
    );
  };
  
  // Render case section with expand/collapse
  const renderCaseSection = (
    engineerId: string, 
    sectionType: 'critical' | 'normal', 
    cases: Case[], 
    title: string, 
    icon: React.ReactNode
  ) => {
    const sectionId = `${engineerId}-${sectionType}`;
    const isExpanded = expandedSections[sectionId] !== false; // Default to expanded if not set
    
    return (
      <Box sx={{ mb: 0.5 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 1.25,
            backgroundColor: sectionType === 'critical' 
              ? 'rgba(250, 77, 86, 0.05)' 
              : 'rgba(69, 137, 255, 0.05)',
            cursor: 'pointer',
            borderLeft: sectionType === 'critical' 
              ? '3px solid #fa4d56' 
              : '3px solid #4589ff',
            '&:hover': {
              backgroundColor: sectionType === 'critical' 
                ? 'rgba(250, 77, 86, 0.08)' 
                : 'rgba(69, 137, 255, 0.08)',
            }
          }}
          onClick={() => handleToggleExpand(sectionId)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {icon}
            <Typography 
              variant="subtitle2" 
              sx={{ 
                ml: 0.75, 
                fontWeight: 600,
                color: sectionType === 'critical' ? 'error.main' : 'primary.main',
                fontSize: '0.8rem'
              }}
            >
              {title} ({cases.length})
            </Typography>
          </Box>
          {isExpanded ? <ArrowDropUpIcon fontSize="small" /> : <ArrowDropDownIcon fontSize="small" />}
        </Box>
        
        <Collapse in={isExpanded}>
          <Box sx={{ px: 0.5 }}>
            {cases.length > 0 ? (
              cases.map(caseItem => renderCaseCard(caseItem))
            ) : (
              <Box sx={{ p: 0.5, textAlign: 'center' }}>
                {/* Empty state is hidden as per requirement */}
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>
    );
  };
  
  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%', 
      margin: 0,
      padding: 0
    }}>
      {/* Week indicator and date range */}
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
              {getWeekNumber()}
            </Typography>
            <Typography variant="body1">
              {getDateRangeString()}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<NumbersIcon />}
            onClick={handleOpenCaseCountDialog}
            sx={{ 
              mr: 1.5, 
              borderRadius: 28,
              px: 2,
              py: 1,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Set Starting Cases
          </Button>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenCaseDialog()}
            sx={{ 
              borderRadius: 28,
              px: 2,
              py: 1,
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            Assign Case
          </Button>
        </Box>
      </Box>
      
      {/* Header with date tabs */}
      <Box 
        sx={{ 
          mb: 2, 
          backgroundColor: 'background.paper',
          borderRadius: 2,
          overflow: 'hidden',
          width: '100%',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }}
      >
        <Box sx={{ 
          p: 1.5, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ 
              backgroundColor: 'primary.main', 
              borderRadius: '50%', 
              width: 36, 
              height: 36, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mr: 1.5
            }}>
              <CalendarIcon sx={{ color: 'white' }} />
            </Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 500 }}>
              Daily Case Assignments
            </Typography>
          </Box>
          <Box>
            <IconButton 
              color="primary"
              onClick={() => {
                // Refresh the data
                const dateString = selectedDate.toISOString().split('T')[0];
                const casesForDate = getDailyCases(dateString);
                setDailyCases(casesForDate);
              }}
              sx={{ 
                backgroundColor: 'rgba(69, 137, 255, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(69, 137, 255, 0.2)',
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Tabs 
          value={selectedTabIndex} 
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{ 
            backgroundColor: 'background.paper',
            '& .MuiTab-root': {
              py: 1.5,
              fontWeight: 500,
              transition: 'all 0.2s',
              '&.Mui-selected': {
                backgroundColor: 'rgba(69, 137, 255, 0.08)',
              }
            }
          }}
        >
          {dates.map((date, index) => (
            <Tab 
              key={index} 
              label={
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {format(date, 'EEE').toUpperCase()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {format(date, 'MMM d')}
                  </Typography>
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>
      
      <Box sx={{ mb: 2, px: 1 }}>
        <Typography variant="h6" sx={{ 
          display: 'flex', 
          alignItems: 'center',
          color: 'text.primary',
          fontWeight: 500
        }}>
          <Box sx={{ 
            backgroundColor: 'primary.main', 
            borderRadius: '50%', 
            width: 32, 
            height: 32, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            mr: 1.5
          }}>
            <AssignmentIcon sx={{ color: 'white', fontSize: '1.2rem' }} />
          </Box>
          {formatDateForDisplay(selectedDate)} • {getTotalCasesCount()} cases assigned today
        </Typography>
      </Box>
      
      <Box 
        sx={{ 
          width: '100%',
          pb: 3
        }}
      >
        <Grid container spacing={3} sx={{ px: 1 }}>
          {engineers.filter(engineer => engineer.isActive).map((engineer) => {
            const criticalCases = getCriticalCases(engineer.id);
            const normalCases = getNormalCases(engineer.id);
            const totalCaseCount = getTotalCaseCount(engineer.id);
            const additionalCases = engineerCaseCounts[selectedDate.toISOString().split('T')[0]]?.[engineer.id] || 0;
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={engineer.id}>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    height: '100%',
                    backgroundColor: 'background.paper',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: engineer.disableAssignment ? '0 4px 12px rgba(0, 0, 0, 0.08)' : '0 6px 16px rgba(0, 0, 0, 0.12)',
                      transform: engineer.disableAssignment ? 'none' : 'translateY(-3px)'
                    },
                    position: 'relative',
                    opacity: engineer.disableAssignment ? 0.6 : 1,
                    pointerEvents: engineer.disableAssignment ? 'none' : 'auto'
                  }}
                >
                  {engineer.disableAssignment && (
                    <Box sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.03)',
                      pointerEvents: 'auto'
                    }}>
                      <Chip 
                        label={engineer.label || "Case Assignment Disabled"} 
                        color="error" 
                        sx={{ 
                          fontWeight: 'bold',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                        }} 
                      />
                    </Box>
                  )}
                  {/* Colored top bar based on critical cases */}
                  <Box sx={{ 
                    height: '6px', 
                    width: '100%', 
                    background: criticalCases.length > 0 
                      ? 'linear-gradient(90deg, #fa4d56 30%, #ff832b 100%)' 
                      : 'linear-gradient(90deg, #4589ff 30%, #8a3ffc 100%)'
                  }} />
                  
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                        {engineer.name}
                      </Typography>
                      <Button 
                        size="small" 
                        variant="outlined"
                        startIcon={<AddIcon />}
                        disabled={engineer.disableAssignment}
                        onClick={() => {
                          // Pre-fill the engineer
                          setCaseFormData({
                            caseNumber: '',
                            description: '',
                            priority: undefined,
                            assignedTo: engineer.id,
                            status: 'New'
                          });
                          
                          // Set flag to indicate dialog was opened from engineer card
                          setIsFromEngineerCard(true);
                          
                          // Filter silos to only show those the engineer belongs to
                          const engineerSilos = engineer.siloIds || [];
                          
                          setIsEditMode(false);
                          setOpenCaseDialog(true);
                        }}
                        sx={{ 
                          height: '32px', 
                          fontSize: '0.8rem',
                          borderRadius: '16px',
                          textTransform: 'none'
                        }}
                      >
                        Assign
                      </Button>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mb: 1.5,
                      pb: 1.5,
                      borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                    }}>
                      <Typography variant="body1" sx={{ fontSize: '0.9rem', fontWeight: 500, color: 'text.secondary' }}>
                        {additionalCases > 0 ? `${additionalCases} starting cases` : 'No starting cases'}
                      </Typography>
                      {criticalCases.length > 0 && (
                        <Chip
                          label={`${criticalCases.length} SEV 1`}
                          size="small"
                          color="error"
                          sx={{ 
                            height: '26px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            borderRadius: '13px'
                          }}
                        />
                      )}
                    </Box>
                    
                    {totalCaseCount > 0 && (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: 'rgba(69, 137, 255, 0.08)',
                        borderRadius: 2,
                        p: 1,
                        mb: 1.5
                      }}>
                        <Typography variant="body1" sx={{ fontSize: '0.95rem', fontWeight: 700 }}>
                          Total: {totalCaseCount} cases
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Box>
                    {/* Critical Cases Section */}
                    {renderCaseSection(
                      engineer.id,
                      'critical',
                      criticalCases,
                      'SEV 1',
                      <PriorityHighIcon sx={{ color: 'error.main', fontSize: '0.9rem' }} />
                    )}
                    
                    {/* Normal Cases Section */}
                    {renderCaseSection(
                      engineer.id,
                      'normal',
                      normalCases,
                      'SEV 2-4',
                      <AssignmentIcon sx={{ color: 'primary.main', fontSize: '0.9rem' }} />
                    )}
                  </Box>
                </Paper>
              </Grid>
            );
          })}
          
          {engineers.filter(engineer => engineer.isActive).length === 0 && (
            <Grid item xs={12}>
              <Paper 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  No active engineers found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Add engineers from the Engineers page to start assigning cases
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
      
      {/* Case Dialog */}
      <Dialog 
        open={openCaseDialog} 
        onClose={handleCloseCaseDialog} 
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
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
        }}>
          {isEditMode ? 'Edit Case' : 'Assign New Case'}
        </DialogTitle>
        <DialogContent dividers sx={{ borderTop: 'none', borderBottom: 'none', p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="caseNumber"
                label="Case Number"
                value={caseFormData.caseNumber || ''}
                onChange={handleCaseFormChange}
                fullWidth
                margin="normal"
                disabled={isEditMode}
                required
                error={!caseFormData.caseNumber}
                helperText={!caseFormData.caseNumber ? "Case number is required" : ""}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" required error={!caseFormData.priority}>
                <InputLabel id="priority-label">Severity</InputLabel>
                <Select
                  labelId="priority-label"
                  name="priority"
                  value={caseFormData.priority || ''}
                  onChange={handleSelectChange}
                  label="Severity"
                >
                  <MenuItem value="">
                    <em>Select Severity</em>
                  </MenuItem>
                  <MenuItem value="Low">SEV 4 (Low)</MenuItem>
                  <MenuItem value="Medium">SEV 3 (Medium)</MenuItem>
                  <MenuItem value="High">SEV 2 (High)</MenuItem>
                  <MenuItem value="Critical">SEV 1 (Critical)</MenuItem>
                </Select>
                {!caseFormData.priority && (
                  <FormHelperText>Severity is required</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="silo-label">Silo</InputLabel>
                <Select
                  labelId="silo-label"
                  name="silo"
                  value={selectedSilo}
                  onChange={handleSiloChange}
                  label="Silo"
                >
                  <MenuItem value="">
                    <em>Select a Silo</em>
                  </MenuItem>
                  {isFromEngineerCard && caseFormData.assignedTo ? 
                    // If opened from engineer card, only show silos the engineer belongs to
                    silos.filter(silo => {
                      const engineer = engineers.find(e => e.id === caseFormData.assignedTo);
                      return engineer && engineer.siloIds && engineer.siloIds.includes(silo.id);
                    }).map((silo) => (
                      <MenuItem key={silo.id} value={silo.id}>
                        {silo.name}
                      </MenuItem>
                    ))
                    :
                    // Otherwise show all silos
                    silos.map((silo) => (
                      <MenuItem key={silo.id} value={silo.id}>
                        {silo.name}
                      </MenuItem>
                    ))
                  }
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="assigned-to-label">Assigned Engineer</InputLabel>
                <Select
                  labelId="assigned-to-label"
                  name="assignedTo"
                  value={caseFormData.assignedTo || ''}
                  onChange={handleSelectChange}
                  label="Assigned Engineer"
                  disabled={isFromEngineerCard}
                >
                  <MenuItem value="">
                    <em>Select an Engineer</em>
                  </MenuItem>
                  {filteredEngineers.map((engineer) => (
                    <MenuItem key={engineer.id} value={engineer.id}>
                      {engineer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={caseFormData.description || ''}
                onChange={handleCaseFormChange}
                fullWidth
                multiline
                rows={3}
                margin="normal"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
          <Button 
            onClick={handleCloseCaseDialog}
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
            onClick={handleSaveCase} 
            variant="contained" 
            color="primary"
            disabled={!caseFormData.caseNumber || !caseFormData.priority || !caseFormData.assignedTo || !selectedSilo}
            sx={{ 
              borderRadius: 28,
              px: 3,
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            {isEditMode ? 'Update' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Case Count Dialog */}
      <Dialog 
        open={openCaseCountDialog} 
        onClose={handleCloseCaseCountDialog} 
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
          borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
        }}>
          Set Starting Case Counts
        </DialogTitle>
        <DialogContent dividers sx={{ borderTop: 'none', borderBottom: 'none', p: 3 }}>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Enter the number of cases each engineer already has at the start of the day.
          </Typography>
          <List sx={{ pt: 0 }}>
            {engineers.filter(engineer => engineer.isActive).map((engineer) => (
              <ListItem 
                key={engineer.id} 
                sx={{ 
                  py: 1.5,
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                  '&:last-child': {
                    borderBottom: 'none'
                  }
                }}
              >
                <ListItemText 
                  primary={engineer.name} 
                  primaryTypographyProps={{ fontWeight: 'bold' }}
                />
                <TextField
                  label="Starting Cases"
                  type="number"
                  value={caseCountFormData[engineer.id] || ""}
                  onChange={(e) => handleCaseCountChange(engineer.id, e.target.value)}
                  InputProps={{
                    inputProps: { min: 0 },
                    startAdornment: <InputAdornment position="start">#</InputAdornment>,
                  }}
                  variant="outlined"
                  size="small"
                  sx={{ 
                    width: '140px',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
          <Button 
            onClick={handleCloseCaseCountDialog}
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
            onClick={handleSaveCaseCounts} 
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
            Save Counts
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DailyView; 
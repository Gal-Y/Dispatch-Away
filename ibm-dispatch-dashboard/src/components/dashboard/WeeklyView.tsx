import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  DateRange as DateRangeIcon,
  Refresh as RefreshIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { format, startOfWeek, addDays, getWeek, getYear, isSameMonth } from 'date-fns';
import { useAppContext } from '../../context/AppContext';
import { Case, Silo } from '../../models/types';

// Function to get the current Monday
const getMonday = (d: Date): Date => {
  const dateCopy = new Date(d);
  const day = dateCopy.getDay();
  const diff = dateCopy.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  dateCopy.setDate(diff);
  return dateCopy;
};

// Function to get silo color based on name
const getSiloColor = (siloName: string): string => {
  const colorMap: Record<string, string> = {
    'Integration': '#33b1ff', // IBM Blue 40
    'EAM': '#ff7eb6',         // IBM Magenta 40
    'Reports': '#8a3ffc',     // IBM Purple 60
    'Systems': '#ff832b',     // IBM Orange 40
    'TPAE': '#42be65',        // IBM Green 50
    'MAS Core': '#24a148',    // IBM Green 60
    'Mas Monitor': '#1192e8', // IBM Blue 50
    'Mobility': '#ee5396',    // IBM Magenta 60
    'Default': '#4589ff'      // IBM Blue 60
  };
  
  return colorMap[siloName] || colorMap['Default'];
};

const WeeklyView: React.FC = () => {
  const { engineers, cases, silos, getDailyCases } = useAppContext();
  
  // Memoize dates so they don't trigger repeated effect executions
  const dates = React.useMemo(() => {
    const today = new Date();
    const monday = getMonday(today);
    return Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  }, []);
  
  // State for weekly data
  const [weeklyData, setWeeklyData] = React.useState<Record<string, Record<string, string[]>>>({});
  const [dailyTotals, setDailyTotals] = React.useState<Record<string, number>>({});
  const [engineerTotals, setEngineerTotals] = React.useState<Record<string, number>>({});
  const [grandTotal, setGrandTotal] = React.useState<number>(0);
  
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
  
  // Get silo name by ID
  const getSiloName = (siloId: string): string => {
    const silo = silos.find((s) => s.id === siloId);
    return silo ? silo.name : 'Unknown';
  };
  
  // Get silos for a specific engineer on a specific date
  const getEngineerSilosForDate = (engineerId: string, date: string): string[] => {
    const dateString = date.split('T')[0];
    const engineerCases = weeklyData[engineerId]?.[dateString] || [];
    
    // Map case IDs to silo names
    const siloNames: string[] = [];
    
    engineerCases.forEach(caseId => {
      const caseItem = cases.find(c => c.id === caseId);
      if (caseItem && caseItem.assignedTo === engineerId) {
        // Find the engineer to get their silo
        const engineer = engineers.find(e => e.id === engineerId);
        if (engineer && engineer.siloIds.length > 0) {
          // Use the first silo for simplicity
          const siloName = getSiloName(engineer.siloIds[0]);
          if (!siloNames.includes(siloName)) {
            siloNames.push(siloName);
          }
        }
      }
    });
    
    return siloNames;
  };
  
  // Load weekly data
  React.useEffect(() => {
    const weekData: Record<string, Record<string, string[]>> = {};
    const dayTotals: Record<string, number> = {};
    const engTotals: Record<string, number> = {};
    let total = 0;
    
    // Initialize data structure
    engineers.filter(e => e.isActive).forEach(engineer => {
      weekData[engineer.id] = {};
      engTotals[engineer.id] = 0;
    });
    
    // Populate data for each day
    dates.forEach(date => {
      const dateString = date.toISOString().split('T')[0];
      dayTotals[dateString] = 0;
      
      const dailyCases = getDailyCases(dateString);
      
      // Process each engineer's cases for this day
      engineers.filter(e => e.isActive).forEach(engineer => {
        const engineerCases = dailyCases[engineer.id] || [];
        weekData[engineer.id][dateString] = engineerCases.map(c => c.id);
        
        // Update totals
        dayTotals[dateString] += engineerCases.length;
        engTotals[engineer.id] += engineerCases.length;
        total += engineerCases.length;
      });
    });
    
    setWeeklyData(weekData);
    setDailyTotals(dayTotals);
    setEngineerTotals(engTotals);
    setGrandTotal(total);
  }, [engineers, cases, dates, getDailyCases]);
  
  // Refresh data
  const handleRefresh = () => {
    // Re-fetch data
    const weekData: Record<string, Record<string, string[]>> = {};
    const dayTotals: Record<string, number> = {};
    const engTotals: Record<string, number> = {};
    let total = 0;
    
    // Initialize data structure
    engineers.filter(e => e.isActive).forEach(engineer => {
      weekData[engineer.id] = {};
      engTotals[engineer.id] = 0;
    });
    
    // Populate data for each day
    dates.forEach(date => {
      const dateString = date.toISOString().split('T')[0];
      dayTotals[dateString] = 0;
      
      const dailyCases = getDailyCases(dateString);
      
      // Process each engineer's cases for this day
      engineers.filter(e => e.isActive).forEach(engineer => {
        const engineerCases = dailyCases[engineer.id] || [];
        weekData[engineer.id][dateString] = engineerCases.map(c => c.id);
        
        // Update totals
        dayTotals[dateString] += engineerCases.length;
        engTotals[engineer.id] += engineerCases.length;
        total += engineerCases.length;
      });
    });
    
    setWeeklyData(weekData);
    setDailyTotals(dayTotals);
    setEngineerTotals(engTotals);
    setGrandTotal(total);
  };
  
  return (
    <Box 
      id="weekly-view-container"
      sx={{ 
        width: '100%', 
        maxWidth: '100%', 
        margin: 0,
        padding: 0,
        position: 'static',
        pointerEvents: 'auto'
      }}
    >
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
      </Box>
      
      {/* Header */}
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
              Weekly Case Distribution Table
            </Typography>
          </Box>
          <Box>
            <IconButton 
              color="primary"
              onClick={handleRefresh}
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
      </Box>
      
      {/* Weekly Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          mb: 4, 
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
              <TableCell sx={{ fontWeight: 'bold', width: '200px' }}>Engineer</TableCell>
              {dates.map((date, index) => (
                <TableCell key={index} align="center" sx={{ fontWeight: 'bold' }}>
                  {format(date, 'EEEE')}
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {engineers.filter(e => e.isActive).map((engineer) => (
              <TableRow key={engineer.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                  {engineer.name}
                </TableCell>
                
                {dates.map((date, index) => {
                  const dateString = date.toISOString().split('T')[0];
                  const siloNames = getEngineerSilosForDate(engineer.id, dateString);
                  const caseCount = weeklyData[engineer.id]?.[dateString]?.length || 0;
                  
                  return (
                    <TableCell key={index} align="center">
                      {siloNames.map((siloName, idx) => (
                        <Chip
                          key={idx}
                          label={siloName}
                          sx={{
                            m: 0.5,
                            backgroundColor: getSiloColor(siloName),
                            color: '#fff',
                            fontWeight: 'bold'
                          }}
                        />
                      ))}
                      {caseCount > 0 && (
                        <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold' }}>
                          {caseCount} case{caseCount !== 1 ? 's' : ''}
                        </Typography>
                      )}
                    </TableCell>
                  );
                })}
                
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  {engineerTotals[engineer.id] || 0}
                </TableCell>
              </TableRow>
            ))}
            
            {/* Daily Totals Row */}
            <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Daily Total</TableCell>
              {dates.map((date, index) => {
                const dateString = date.toISOString().split('T')[0];
                return (
                  <TableCell key={index} align="center" sx={{ fontWeight: 'bold' }}>
                    {dailyTotals[dateString] || 0}
                  </TableCell>
                );
              })}
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                {grandTotal}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WeeklyView; 
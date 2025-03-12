import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Engineer, Case, Silo } from '../models/types';

// Define the context state type
interface AppContextState {
  // Data
  engineers: Engineer[];
  silos: Silo[];
  cases: Case[];
  
  // Engineer actions
  addEngineer: (engineer: Omit<Engineer, 'id'>) => void;
  updateEngineer: (id: string, updates: Partial<Engineer>) => void;
  removeEngineer: (id: string) => void;
  
  // Silo actions
  addSilo: (silo: Omit<Silo, 'id'>) => void;
  updateSilo: (id: string, updates: Partial<Silo>) => void;
  removeSilo: (id: string) => void;
  
  // Case actions
  addCase: (caseData: Omit<Case, 'id'>) => void;
  updateCase: (id: string, updates: Partial<Case>) => void;
  removeCase: (id: string) => void;
  assignCase: (caseId: string, engineerId: string | null, date: string) => void;
  getDailyCases: (date: string) => Record<string, Case[]>;
  
  // Counter (for testing)
  count: number;
  increment: () => void;
  decrement: () => void;
}

// Create the context with a default value of undefined
const AppContext = createContext<AppContextState | undefined>(undefined);

// Provider props type
interface AppProviderProps {
  children: ReactNode;
}

// Generate a unique ID
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Format date to YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// AppProvider component
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // State for our data
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [silos, setSilos] = useState<Silo[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [count, setCount] = useState(0);

  // Counter actions (for testing)
  const increment = () => setCount(prevCount => prevCount + 1);
  const decrement = () => setCount(prevCount => prevCount - 1);

  // Engineer actions
  const addEngineer = (engineer: Omit<Engineer, 'id'>) => {
    const newEngineer = { ...engineer, id: generateId() };
    setEngineers(prevEngineers => [...prevEngineers, newEngineer]);
  };

  const updateEngineer = (id: string, updates: Partial<Engineer>) => {
    setEngineers(prevEngineers => 
      prevEngineers.map(engineer => 
        engineer.id === id ? { ...engineer, ...updates } : engineer
      )
    );
  };

  const removeEngineer = (id: string) => {
    setEngineers(prevEngineers => prevEngineers.filter(engineer => engineer.id !== id));
  };

  // Silo actions
  const addSilo = (silo: Omit<Silo, 'id'>) => {
    const newSilo = { ...silo, id: generateId() };
    setSilos(prevSilos => [...prevSilos, newSilo]);
  };

  const updateSilo = (id: string, updates: Partial<Silo>) => {
    setSilos(prevSilos => prevSilos.map(silo => 
      silo.id === id ? { ...silo, ...updates } : silo
    ));
  };

  const removeSilo = (id: string) => {
    setSilos(prevSilos => prevSilos.filter(silo => silo.id !== id));
    
    // Remove silo assignment from engineers
    setEngineers(prevEngineers => 
      prevEngineers.map(engineer => 
        engineer.siloIds.includes(id) ? { 
          ...engineer, 
          siloIds: engineer.siloIds.filter(siloId => siloId !== id) 
        } : engineer
      )
    );
  };

  // Case actions
  const addCase = (caseData: Omit<Case, 'id'>) => {
    const newCase = { 
      ...caseData, 
      id: generateId(),
      // Ensure all required fields have default values if not provided
      status: caseData.status || 'New',
      priority: caseData.priority || 'Medium',
      assignedTo: caseData.assignedTo || null,
      dateCreated: caseData.dateCreated || new Date().toISOString(),
      dateAssigned: caseData.dateAssigned || ''
    };
    setCases(prevCases => [...prevCases, newCase as Case]);
  };

  const updateCase = (id: string, updates: Partial<Case>) => {
    setCases(prevCases => prevCases.map(caseItem => 
      caseItem.id === id ? { ...caseItem, ...updates } : caseItem
    ));
  };

  const removeCase = (id: string) => {
    setCases(prevCases => prevCases.filter(caseItem => caseItem.id !== id));
  };

  const assignCase = (caseId: string, engineerId: string | null, date: string) => {
    setCases(prevCases => prevCases.map(caseItem => {
      if (caseItem.id === caseId) {
        return {
          ...caseItem,
          assignedTo: engineerId,
          dateAssigned: date
        };
      }
      return caseItem;
    }));
  };

  const getDailyCases = (date: string): Record<string, Case[]> => {
    // Group cases by engineer
    const engineerCases: Record<string, Case[]> = {};
    
    // Initialize with all active engineers
    engineers.forEach(engineer => {
      if (engineer.isActive) {
        engineerCases[engineer.id] = [];
      }
    });
    
    // Add unassigned cases group
    engineerCases['unassigned'] = [];
    
    // Filter cases for the selected date
    const filteredCases = cases.filter(caseItem => {
      // Include cases that are assigned on this date or were created on this date
      const createdOnDate = caseItem.dateCreated.split('T')[0] === date;
      const assignedOnDate = caseItem.dateAssigned && caseItem.dateAssigned.split('T')[0] === date;
      
      return createdOnDate || assignedOnDate;
    });
    
    // Group cases by engineer
    filteredCases.forEach(caseItem => {
      if (caseItem.assignedTo && engineerCases[caseItem.assignedTo]) {
        engineerCases[caseItem.assignedTo].push(caseItem);
      } else {
        engineerCases['unassigned'].push(caseItem);
      }
    });
    
    return engineerCases;
  };

  // Create the context value
  const contextValue: AppContextState = {
    engineers,
    silos,
    cases,
    addEngineer,
    updateEngineer,
    removeEngineer,
    addSilo,
    updateSilo,
    removeSilo,
    addCase,
    updateCase,
    removeCase,
    assignCase,
    getDailyCases,
    count,
    increment,
    decrement
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = (): AppContextState => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 
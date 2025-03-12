export interface Engineer {
  id: string;
  name: string;
  email: string;
  siloIds: string[];
  isActive: boolean;
  siloLabels?: Record<string, string | string[]>; // Map of siloId -> label or labels array
  label?: string; // Optional label for engineer status (e.g., leave)
  disableAssignment?: boolean; // Flag to disable case assignment when true
}

export interface Case {
  id: string;
  caseNumber: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'New' | 'In Progress' | 'Waiting' | 'Resolved' | 'Closed';
  assignedTo: string | null; // Engineer ID
  dateAssigned: string; // ISO date string
  dateCreated: string; // ISO date string
  dateResolved?: string; // ISO date string
  customer: string;
}

export interface Silo {
  id: string;
  name: string;
  description: string;
}

export interface DailyAssignment {
  date: string; // ISO date string
  engineerId: string;
  caseIds: string[]; // Array of Case IDs
}

export interface WeeklyDistribution {
  weekStartDate: string; // ISO date string
  assignments: {
    [engineerId: string]: {
      [date: string]: string[]; // Date -> Array of Case IDs
    };
  };
} 
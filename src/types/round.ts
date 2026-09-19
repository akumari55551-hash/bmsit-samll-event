export type RoundNumber = 1 | 2 | 3 | 4 | 5;

export type RoundStatus = 'Scheduled' | 'Live' | 'Under Review' | 'Completed';

export interface RoundInfo {
  roundNumber: RoundNumber;
  name: string;
  codename: string;
  description: string;
  initialTeamsCount: number;
  qualifyingTeamsCount: number;
  status: RoundStatus;
  startedAt?: string;
  endedAt?: string;
  location: string;
}

export interface RoundProgressionStep {
  roundNumber: RoundNumber;
  name: string;
  qualifyingCount: number;
  totalPool: number;
  status: RoundStatus;
}

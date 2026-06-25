import { API_URLS } from '../constants';
import { apiRequest } from './api.client';
import type { Evaluation, TeamMember } from '../types';

export interface Associate {
  id: string;
  name: string;
  employeeId: string;
  employeeNumber: string;
  joinDate: string;
  manager: string;
  probation: string;
  status: string;
  avatar: string;
  project: {
    name: string;
    phase: string;
    progress: number;
    status: string;
  };
  history: Array<{
    month: string;
    monthKey?: string;
    tech: number;
    learn: number;
    adapt: number;
    attitude: number;
    comments: string;
    average: number;
    savedAt?: string;
    locked?: boolean;
  }>;
  currentEvaluation: {
    tech: number;
    learn: number;
    adapt: number;
    attitude: number;
    comments: string;
    average?: number;
    savedAt?: string;
  };
  averagePerformanceScore?: number;
  evaluationLockedForMonth?: string;
  syncedFromHr?: boolean;
  department?: string;
  totalHoursWorked?: number;
}

export interface ManagerDashboardData {
  stats: {
    teamSize: number;
    pendingEvaluations: number;
    completedEvaluations: number;
    avgPerformanceScore: number;
  };
  upcomingReviews: Evaluation[];
}

export const managerService = {
  getDashboard(token: string) {
    return apiRequest<ManagerDashboardData>(API_URLS.MANAGER, '/dashboard', { token });
  },

  getTeam(token: string) {
    return apiRequest<{ team: TeamMember[] }>(API_URLS.MANAGER, '/team', { token });
  },

  getEvaluations(token: string) {
    return apiRequest<{ evaluations: Evaluation[] }>(API_URLS.MANAGER, '/evaluations', { token });
  },

  getAssociates(token: string) {
    return apiRequest<Associate[]>(API_URLS.MANAGER, '/api/associates', { token });
  },

  getAssociateDetails(token: string, id: string) {
    return apiRequest<Associate>(API_URLS.MANAGER, `/api/associates/${id}`, { token });
  },

  saveEvaluation(token: string, id: string, data: { tech: number; learn: number; adapt: number; attitude: number; comments: string }) {
    return apiRequest<Associate>(API_URLS.MANAGER, `/api/associates/${id}/evaluations`, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    });
  },

  deleteAssociate(token: string, id: string) {
    return apiRequest<{ message: string }>(API_URLS.MANAGER, `/api/associates/${id}`, {
      method: 'DELETE',
      token,
    });
  },

  resetDatabase(token: string) {
    return apiRequest<{ message: string }>(API_URLS.MANAGER, '/api/reset', {
      method: 'POST',
      token,
    });
  },
};


import { API_URLS } from '../constants';
import { apiRequest } from './api.client';

export interface HrDashboardData {
  stats: {
    totalEmployees: number;
    activeEmployees: number;
    onLeave: number;
    departments: number;
  };
  recentHires: Array<{
    id: string;
    name: string;
    department: string;
    position: string;
    status: string;
  }>;
}

export interface HrDocument {
  id: string;
  name: string;
  type: string;
  dateAdded: string;
  owner: string;
  avatar?: string;
}

export interface HrActivity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
}

export interface HrStorageStats {
  used: number;
  limit: number;
  documentsCount: number;
  mediaCount: number;
  legal: number;
  policies: number;
  records: number;
}

export const hrService = {
  getDashboard(token: string) {
    return apiRequest<HrDashboardData>(API_URLS.HR, '/dashboard', { token });
  },

  getEmployees(token: string) {
    return apiRequest<{ employees: HrDashboardData['recentHires'] }>(API_URLS.HR, '/employees', { token });
  },

  getReportsSummary(token: string) {
    return apiRequest<{ reports: Array<{ id: string; title: string; type: string; generatedAt: string; status: string }> }>(
      API_URLS.HR,
      '/reports/summary',
      { token },
    );
  },

  getDocuments(token: string) {
    return apiRequest<{ documents: HrDocument[] }>(API_URLS.HR, '/api/documents', { token });
  },

  uploadDocument(token: string, name: string, type?: string) {
    return apiRequest<HrDocument>(API_URLS.HR, '/api/documents/upload', {
      method: 'POST',
      token,
      body: JSON.stringify({ name, type }),
    });
  },

  getActivity(token: string) {
    return apiRequest<{ activities: HrActivity[] }>(API_URLS.HR, '/api/activity', { token });
  },

  getStorage(token: string) {
    return apiRequest<{ storage: HrStorageStats }>(API_URLS.HR, '/api/storage', { token });
  },
};


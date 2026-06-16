import { API_URLS } from '../constants';
import { apiRequest } from './api.client';
import type { Report } from '../types';

export const reportService = {
  getReports(token: string) {
    return apiRequest<{ reports: Report[] }>(API_URLS.REPORT, '/reports', { token });
  },
};

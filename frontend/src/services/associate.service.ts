import { API_URLS } from '../constants';
import { apiRequest } from './api.client';
import type {
  AssociateTaskSyncResponse,
  AssociateUploadResponse,
  ProcessedAssociate,
} from '../types';

export const associateService = {
  uploadAssociates(token: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return apiRequest<AssociateUploadResponse>(API_URLS.HR, '/api/associates/upload', {
      method: 'POST',
      token,
      body: formData,
    });
  },

  syncTasks(token: string) {
    return apiRequest<AssociateTaskSyncResponse>(API_URLS.HR, '/api/associates/sync-tasks', {
      method: 'POST',
      token,
    });
  },

  getAssociates(token: string) {
    return apiRequest<{ associates: ProcessedAssociate[] }>(API_URLS.HR, '/api/associates', {
      token,
    });
  },

  getAssociate(token: string, employeeId: string) {
    return apiRequest<ProcessedAssociate>(
      API_URLS.HR,
      `/api/associates/${encodeURIComponent(employeeId)}`,
      { token },
    );
  },
};

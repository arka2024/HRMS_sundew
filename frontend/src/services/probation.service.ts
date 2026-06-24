import { apiRequest } from './api.client';
import { API_URLS } from '../constants';

export const probationService = {
  uploadEmployees(token: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`${API_URLS.PROBATION}/api/hr/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload employee file');
      }
      return response.json();
    });
  },

  getManagerEmployees(token: string) {
    return apiRequest<{ employees: Array<Record<string, unknown>> }>(
      API_URLS.PROBATION,
      '/api/manager/employees',
      { token },
    );
  },
};

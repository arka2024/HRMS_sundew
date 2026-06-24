import { API_URLS } from '../constants';
import { apiRequest } from './api.client';

export interface SyncedEmployee {
  employeeNumber: string;
  employeeName: string;
  dateOfJoining: string;
  totalHoursWorked: number;
  department: string;
  projectName: string;
}

export interface EmployeeUploadError {
  row: number;
  employeeNumber?: string;
  reason: string;
}

export interface EmployeeUploadResponse {
  successCount: number;
  failedCount: number;
  errors: EmployeeUploadError[];
  employees?: SyncedEmployee[];
  managerId?: string;
}

export interface EmployeePreviewResponse {
  fileName: string;
  preview: SyncedEmployee[];
  failedRecords: EmployeeUploadError[];
  summary: {
    total: number;
    valid: number;
    failed: number;
  };
}

export interface EmployeeUploadHistoryItem {
  id: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  successCount: number;
  failedCount: number;
  errors: EmployeeUploadError[];
}

export interface DemoManager {
  id: string;
  employeeId: string;
  name: string;
  email: string;
}

export const employeeService = {
  previewUpload(token: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return apiRequest<EmployeePreviewResponse>(API_URLS.PROBATION, '/api/hr/preview', {
      method: 'POST',
      token,
      body: formData,
    });
  },

  uploadEmployees(token: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return apiRequest<EmployeeUploadResponse>(API_URLS.PROBATION, '/api/hr/upload', {
      method: 'POST',
      token,
      body: formData,
    });
  },

  getUploadHistory(token: string) {
    return apiRequest<{ history: EmployeeUploadHistoryItem[] }>(
      API_URLS.PROBATION,
      '/api/hr/upload-history',
      { token },
    );
  },

  getHrEmployees(token: string) {
    return apiRequest<{ employees: SyncedEmployee[] }>(API_URLS.PROBATION, '/api/hr/employees', { token });
  },

  getManagerEmployees(token: string) {
    return apiRequest<{ employees: SyncedEmployee[] }>(API_URLS.PROBATION, '/api/manager/employees', {
      token,
    });
  },

  getDemoManager(token: string) {
    return apiRequest<DemoManager>(API_URLS.MANAGER, '/api/managers/demo', { token });
  },

  getSyncStatus(token: string) {
    return apiRequest<{
      managerId: string;
      managerName: string;
      employeeCount: number;
      syncedAssociateCount: number;
      lastSyncedAt: string | null;
    }>(API_URLS.MANAGER, '/api/sync/status', { token });
  },
};

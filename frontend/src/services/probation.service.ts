import { apiRequest } from './api.client';
import { API_URLS } from '../constants';
import type { Manager, Employee } from '../types';

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

  getEmployees(token: string) {
    return apiRequest<{ employees: Employee[] }>(API_URLS.PROBATION, '/api/hr/employees', { token });
  },

  createEmployee(token: string, employeeData: Omit<Employee, '_id' | 'createdAt' | 'updatedAt'>) {
    return apiRequest<{ employee: Employee; message: string }>(
      API_URLS.PROBATION,
      '/api/hr/employees',
      {
        method: 'POST',
        token,
        body: JSON.stringify(employeeData),
      }
    );
  },

  updateEmployee(token: string, employeeNumber: string, updateData: Partial<Employee>) {
    return apiRequest<{ employee: Employee; message: string }>(
      API_URLS.PROBATION,
      `/api/hr/employees/${employeeNumber}`,
      {
        method: 'PUT',
        token,
        body: JSON.stringify(updateData),
      }
    );
  },

  deleteEmployee(token: string, employeeNumber: string) {
    return apiRequest<{ message: string }>(
      API_URLS.PROBATION,
      `/api/hr/employees/${employeeNumber}`,
      {
        method: 'DELETE',
        token,
      }
    );
  },

  getManagers(token: string, filters?: { status?: string; department?: string }) {
    const query = new URLSearchParams();
    if (filters?.status) query.append('status', filters.status);
    if (filters?.department) query.append('department', filters.department);
    const url = query.toString() ? `/api/managers?${query.toString()}` : '/api/managers';
    return apiRequest<{ managers: Manager[] }>(API_URLS.PROBATION, url, { token });
  },

  getManagerById(token: string, managerId: string) {
    return apiRequest<{ manager: Manager }>(API_URLS.PROBATION, `/api/managers/${managerId}`, { token });
  },

  createManager(token: string, managerData: {
    managerId: string;
    managerName: string;
    email: string;
    password: string;
    department: string;
    status?: string;
  }) {
    return apiRequest<{ manager: Manager }>(API_URLS.PROBATION, '/api/managers', {
      method: 'POST',
      token,
      body: JSON.stringify(managerData),
    });
  },

  updateManager(token: string, managerId: string, updateData: Partial<{
    managerName: string;
    email: string;
    password: string;
    department: string;
    status: string;
  }>) {
    return apiRequest<{ manager: Manager }>(API_URLS.PROBATION, `/api/managers/${managerId}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(updateData),
    });
  },
};

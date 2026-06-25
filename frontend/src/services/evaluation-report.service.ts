import { apiRequest, API_URLS } from './api.client';
import type { EvaluationReport, EvaluationUnlockRequest, ProbationExtension, AssociateManagerMapping } from '../types';

export interface EvaluationDashboardStats {
  totalEvaluatedEmployees: number;
  pendingEvaluations: number;
  completedEvaluations: number;
  lockedEvaluations: number;
  averageRating: number;
}

export interface EvaluationReportSummary {
  totalEvaluations: number;
  averageRatings: {
    performance: string;
    attendance: string;
    productivity: string;
    communication: string;
    learning: string;
    collaboration: string;
    overall: string;
  } | null;
  departmentAverages: Array<{
    department: string;
    employeeCount: number;
    averageScore: string;
  }>;
  topPerformers: EvaluationReport[];
  improvementRequired: EvaluationReport[];
}

export interface BulkReportResponse {
  evaluations: EvaluationReport[];
  summary: EvaluationReportSummary;
}

export interface EmployeeDetail {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  project: {
    name: string;
    phase: string;
    progress: number;
    status: string;
  };
  manager: string;
  joinDate: string;
  probationDurationMonths: number;
  probationEndDate: string;
  status: string;
}

export interface EmployeeReportResponse {
  employee: EmployeeDetail;
  evaluations: EvaluationReport[];
}

export class EvaluationReportService {
  private readonly baseUrl = '/api/evaluation-reports';

  async getDistinctDepartments(token: string): Promise<{ departments: string[] }> {
    return apiRequest<{ departments: string[] }>(
      API_URLS.PROBATION,
      '/api/departments',
      { token }
    );
  }

  async getDashboardStats(token: string, filters?: {
    period?: string;
    startDate?: string;
    endDate?: string;
    months?: string;
    department?: string;
    project?: string;
  }): Promise<EvaluationDashboardStats> {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.months) params.append('months', filters.months);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.project) params.append('project', filters.project);

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}/dashboard?${queryString}` : `${this.baseUrl}/dashboard`;
    return apiRequest<EvaluationDashboardStats>(
      API_URLS.MANAGER,
      url,
      { token },
    );
  }

  async getEvaluations(token: string, filters?: {
    period?: 'monthly' | 'quarterly' | 'yearly' | 'custom';
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    department?: string;
    project?: string;
    managerId?: string;
    status?: string;
    months?: string;
  }): Promise<{ evaluations: EvaluationReport[] }> {
    const params = new URLSearchParams();
    if (filters?.period) params.append('period', filters.period);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.project) params.append('project', filters.project);
    if (filters?.managerId) params.append('managerId', filters.managerId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.months) params.append('months', filters.months);

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
    return apiRequest<{ evaluations: EvaluationReport[] }>(
      API_URLS.MANAGER,
      url,
      { token },
    );
  }

  async getEmployeeReport(token: string, employeeId: string): Promise<EmployeeReportResponse> {
    return apiRequest<EmployeeReportResponse>(
      API_URLS.PROBATION,
      `${this.baseUrl}/${employeeId}`,
      { token },
    );
  }

  async getBulkReport(token: string, employeeIds?: string[], filters?: {
    period?: 'monthly' | 'quarterly' | 'yearly';
  }): Promise<BulkReportResponse> {
    return apiRequest<BulkReportResponse>(
      API_URLS.PROBATION,
      `${this.baseUrl}/bulk`,
      { 
        token,
        method: 'POST',
        body: JSON.stringify({ employeeIds, filters }),
      },
    );
  }

  async lockEvaluation(token: string, employeeId: string, monthKey: string): Promise<{ message: string; evaluation: any }> {
    return apiRequest<{ message: string; evaluation: any }>(
      API_URLS.PROBATION,
      `${this.baseUrl}/lock/${employeeId}/${monthKey}`,
      { 
        token,
        method: 'POST',
      },
    );
  }

  async unlockEvaluation(token: string, employeeId: string, monthKey: string): Promise<{ message: string; evaluation: any }> {
    return apiRequest<{ message: string; evaluation: any }>(
      API_URLS.PROBATION,
      `${this.baseUrl}/unlock/${employeeId}/${monthKey}`,
      { 
        token,
        method: 'POST',
      },
    );
  }

  async exportExcel(token: string): Promise<void> {
    const response = await fetch(`${API_URLS.PROBATION}${this.baseUrl}/export/excel`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
      throw new Error('Failed to export Excel');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'evaluation_reports.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async exportPDF(token: string): Promise<void> {
    const response = await fetch(`${API_URLS.PROBATION}${this.baseUrl}/export/pdf`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!response.ok) {
      throw new Error('Failed to export PDF');
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'evaluation_reports.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async seedEvaluations(token: string): Promise<void> {
    return apiRequest<void>(
      API_URLS.PROBATION,
      `${this.baseUrl}/seed`,
      { 
        token,
        method: 'POST',
      },
    );
  }

  // Evaluation Unlock Request Methods
  async createEvaluationUnlockRequest(token: string, data: Omit<EvaluationUnlockRequest, '_id' | 'requestedDate' | 'status' | 'approvedBy' | 'approvedDate' | 'rejectionReason' | 'createdAt' | 'updatedAt'>) {
    return apiRequest<{ message: string; request: EvaluationUnlockRequest }>(
      API_URLS.PROBATION,
      '/api/evaluation-unlock-requests',
      {
        token,
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getEvaluationUnlockRequests(token: string, filters?: { employeeNumber?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.employeeNumber) params.append('employeeNumber', filters.employeeNumber);
    if (filters?.status) params.append('status', filters.status);
    const url = params.toString() ? `/api/evaluation-unlock-requests?${params.toString()}` : '/api/evaluation-unlock-requests';
    return apiRequest<{ requests: EvaluationUnlockRequest[] }>(API_URLS.PROBATION, url, { token });
  }

  async approveEvaluationUnlockRequest(token: string, id: string) {
    return apiRequest<{ message: string; request: EvaluationUnlockRequest }>(
      API_URLS.PROBATION,
      `/api/evaluation-unlock-requests/${id}/approve`,
      {
        token,
        method: 'POST'
      }
    );
  }

  async rejectEvaluationUnlockRequest(token: string, id: string, rejectionReason: string) {
    return apiRequest<{ message: string; request: EvaluationUnlockRequest }>(
      API_URLS.PROBATION,
      `/api/evaluation-unlock-requests/${id}/reject`,
      {
        token,
        method: 'POST',
        body: JSON.stringify({ rejectionReason })
      }
    );
  }

  // Probation Extension Methods
  async createProbationExtension(token: string, data: Omit<ProbationExtension, '_id' | 'requestedDate' | 'managerApproved' | 'managerApprovedBy' | 'managerApprovedDate' | 'status' | 'approvedBy' | 'approvedDate' | 'rejectionReason' | 'createdAt' | 'updatedAt'>) {
    return apiRequest<{ message: string; extension: ProbationExtension }>(
      API_URLS.PROBATION,
      '/api/probation-extensions',
      {
        token,
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
  }

  async getProbationExtensions(token: string, filters?: { employeeNumber?: string; status?: string }) {
    const params = new URLSearchParams();
    if (filters?.employeeNumber) params.append('employeeNumber', filters.employeeNumber);
    if (filters?.status) params.append('status', filters.status);
    const url = params.toString() ? `/api/probation-extensions?${params.toString()}` : '/api/probation-extensions';
    return apiRequest<{ extensions: ProbationExtension[] }>(API_URLS.PROBATION, url, { token });
  }

  async approveProbationExtensionByManager(token: string, id: string) {
    return apiRequest<{ message: string; extension: ProbationExtension }>(
      API_URLS.PROBATION,
      `/api/probation-extensions/${id}/manager-approve`,
      {
        token,
        method: 'POST'
      }
    );
  }

  async approveProbationExtension(token: string, id: string) {
    return apiRequest<{ message: string; extension: ProbationExtension }>(
      API_URLS.PROBATION,
      `/api/probation-extensions/${id}/approve`,
      {
        token,
        method: 'POST'
      }
    );
  }

  async rejectProbationExtension(token: string, id: string, rejectionReason: string) {
    return apiRequest<{ message: string; extension: ProbationExtension }>(
      API_URLS.PROBATION,
      `/api/probation-extensions/${id}/reject`,
      {
        token,
        method: 'POST',
        body: JSON.stringify({ rejectionReason })
      }
    );
  }

  // Associate Manager Mapping Methods
  async createAssociateManagerMapping(token: string, data: Omit<AssociateManagerMapping, '_id' | 'isActive' | 'createdAt' | 'updatedAt'>) {
    return apiRequest<{ message: string; mapping: AssociateManagerMapping }>(
      API_URLS.PROBATION,
      '/api/associate-manager-mappings',
      {
        token,
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
  }

  async getAssociateManagerMappings(token: string, filters?: { associateEmployeeNumber?: string; managerEmployeeNumber?: string; isActive?: boolean }) {
    const params = new URLSearchParams();
    if (filters?.associateEmployeeNumber) params.append('associateEmployeeNumber', filters.associateEmployeeNumber);
    if (filters?.managerEmployeeNumber) params.append('managerEmployeeNumber', filters.managerEmployeeNumber);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    const url = params.toString() ? `/api/associate-manager-mappings?${params.toString()}` : '/api/associate-manager-mappings';
    return apiRequest<{ mappings: AssociateManagerMapping[] }>(API_URLS.PROBATION, url, { token });
  }

  async updateAssociateManagerMapping(token: string, id: string, data: Partial<AssociateManagerMapping>) {
    return apiRequest<{ message: string; mapping: AssociateManagerMapping }>(
      API_URLS.PROBATION,
      `/api/associate-manager-mappings/${id}`,
      {
        token,
        method: 'PUT',
        body: JSON.stringify(data)
      }
    );
  }

  async deactivateAssociateManagerMapping(token: string, id: string) {
    return apiRequest<{ message: string; mapping: AssociateManagerMapping }>(
      API_URLS.PROBATION,
      `/api/associate-manager-mappings/${id}/deactivate`,
      {
        token,
        method: 'POST'
      }
    );
  }
}

export const evaluationReportService = new EvaluationReportService();

import { apiRequest, API_URLS } from './api.client';

export interface EvaluationReport {
  employeeId: string;
  employeeName: string;
  department: string;
  project: string;
  managerId: string;
  evaluationMonth: string;
  evaluationYear: string;
  performanceScore: number;
  attendanceScore: number;
  productivityScore: number;
  communicationScore: number;
  learningScore: number;
  collaborationScore: number;
  overallScore: number;
  hrRemarks: string;
  status: 'Draft' | 'Completed' | 'Locked';
  lockedBy: string | null;
  lockedDate: string | null;
  savedAt: string;
}

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
      API_URLS.MANAGER,
      `${this.baseUrl}/${employeeId}/lock`,
      { 
        token,
        method: 'POST',
        body: JSON.stringify({ monthKey, lock: true }),
      },
    );
  }

  async unlockEvaluation(token: string, employeeId: string, monthKey: string): Promise<{ message: string; evaluation: any }> {
    return apiRequest<{ message: string; evaluation: any }>(
      API_URLS.MANAGER,
      `${this.baseUrl}/${employeeId}/lock`,
      { 
        token,
        method: 'POST',
        body: JSON.stringify({ monthKey, lock: false }),
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
}

export const evaluationReportService = new EvaluationReportService();

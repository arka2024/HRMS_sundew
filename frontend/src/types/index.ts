export type UserRole = 'hr' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Manager {
  _id?: string;
  managerId: string;
  managerName: string;
  email: string;
  department: string;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Employee {
  _id?: string;
  employeeNumber: string;
  employeeName: string;
  dateOfJoining: string;
  totalHours: number;
  department: string;
  projectName: string;
  managerId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  performance: string;
}

export interface Evaluation {
  id: string;
  employeeName: string;
  period: string;
  status: string;
  score: number;
}

export interface Report {
  id: string;
  title: string;
  type: string;
  generatedAt: string;
  status: string;
}

export interface ApiError {
  error: string;
  status?: number;
}

export interface ServiceHealth {
  status: string;
  service: string;
}

export interface ProcessedAssociate {
  employeeId: string;
  name: string;
  designation: string;
  dateOfJoining: string;
  probationDurationMonths: number;
  probationEndDate: string;
  probationProgress: number;
  monthsWorking: number;
  taskCount: number;
}

export interface AssociateUploadSuccess {
  employeeId: string;
  name: string;
  designation?: string;
  dateOfJoining: string;
  probationDurationMonths: number;
  probationEndDate: string;
}

export interface AssociateUploadFailure {
  row: number;
  employeeId?: string;
  reason: string;
}

export interface AssociateUploadResponse {
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  successfulRecords: AssociateUploadSuccess[];
  failedRecords: AssociateUploadFailure[];
}

export interface AssociateTaskSyncResponse {
  summary: {
    total: number;
    updated: number;
    failed: number;
  };
  updatedRecords: ProcessedAssociate[];
  failedRecords: Array<{
    employeeId: string;
    reason: string;
  }>;
}

// New types for our features!
export interface ProbationExtension {
  _id?: string;
  employeeNumber: string;
  employeeName: string;
  durationMonths: number;
  reason: string;
  requestedBy: string;
  requestedDate: string;
  managerApproved?: boolean;
  managerApprovedBy?: string;
  managerApprovedDate?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EvaluationUnlockRequest {
  _id?: string;
  employeeNumber: string;
  employeeName: string;
  evaluationYear: string;
  evaluationMonth: string;
  reason: string;
  requestedBy: string;
  requestedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssociateManagerMapping {
  _id?: string;
  associateEmployeeNumber: string;
  associateName: string;
  managerEmployeeNumber: string;
  managerName: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LockUnlockHistory {
  action: 'lock' | 'unlock';
  doneBy: string;
  date: string;
  reason?: string;
}

// Updated Evaluation Report interface
export interface EvaluationReport {
  employeeId: string;
  employeeNumber: string;
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
  rating?: string;
  hrRemarks?: string;
  status: string;
  lockedBy?: string;
  lockedDate?: string;
  lockUnlockHistory: LockUnlockHistory[];
  savedAt?: string;
}

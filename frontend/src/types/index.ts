export type UserRole = 'hr' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  position: string;
  status: string;
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

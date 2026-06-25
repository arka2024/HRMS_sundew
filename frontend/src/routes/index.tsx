import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../layouts/AppShell';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { HrAssociateUploadPage } from '../pages/hr/HrAssociateUploadPage';
import { HrDashboardPage } from '../pages/hr/HrDashboardPage';
import { HrEmployeeUploadPage } from '../pages/hr/HrEmployeeUploadPage';
import { HrEmployeesPage } from '../pages/hr/HrEmployeesPage';
import { HrReportsPage } from '../pages/hr/HrReportsPage';
import { EvaluationReportsPage } from '../pages/hr/EvaluationReportsPage';
import { HrManagersPage } from '../pages/hr/HrManagersPage';
import { HrAssociatesPage } from '../pages/hr/HrAssociatesPage';
import { HrProbationExtensionsPage } from '../pages/hr/HrProbationExtensionsPage';
import { HrEvaluationUnlockRequestsPage } from '../pages/hr/HrEvaluationUnlockRequestsPage';
import { HrAssociateManagerMappingsPage } from '../pages/hr/HrAssociateManagerMappingsPage';
import { ManagerAssociatesPage } from '../pages/manager/ManagerAssociatesPage';
import { ManagerDashboardPage } from '../pages/manager/ManagerDashboardPage';
import { ManagerEmployeesPage } from '../pages/manager/ManagerEmployeesPage';
import { ManagerEvaluationsPage } from '../pages/manager/ManagerEvaluationsPage';
import { ManagerTeamPage } from '../pages/manager/ManagerTeamPage';
import { ManagerEvaluationReportsPage } from '../pages/manager/ManagerEvaluationReportsPage';
import { ManagerProbationExtensionsPage } from '../pages/manager/ManagerProbationExtensionsPage';
import { ManagerEvaluationUnlockRequestsPage } from '../pages/manager/ManagerEvaluationUnlockRequestsPage';
import { ProtectedRoute, PublicRoute, RootRedirect } from './ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route path="/dashboard" element={<DashboardPage />} />

      <Route element={<ProtectedRoute allowedRole="hr" />}>
        <Route element={<AppShell />}>
          <Route path="/hr/dashboard" element={<HrDashboardPage />} />
          <Route path="/hr/associates" element={<HrAssociatesPage />} />
          <Route path="/hr/associate-upload" element={<HrAssociateUploadPage />} />
          <Route path="/hr/employees/upload" element={<HrEmployeeUploadPage />} />
          <Route path="/hr/employees" element={<HrEmployeesPage />} />
          <Route path="/hr/reports" element={<HrReportsPage />} />
          <Route path="/hr/evaluation-reports" element={<EvaluationReportsPage />} />
          <Route path="/hr/managers" element={<HrManagersPage />} />
          <Route path="/hr/probation-extensions" element={<HrProbationExtensionsPage />} />
          <Route path="/hr/evaluation-unlock-requests" element={<HrEvaluationUnlockRequestsPage />} />
          <Route path="/hr/associate-manager-mappings" element={<HrAssociateManagerMappingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRole="manager" />}>
        <Route element={<AppShell />}>
          <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
          <Route path="/manager/associates" element={<ManagerAssociatesPage />} />
          <Route path="/manager/employees" element={<ManagerEmployeesPage />} />
          <Route path="/manager/team" element={<ManagerTeamPage />} />
          <Route path="/manager/evaluations" element={<ManagerEvaluationsPage />} />
          <Route path="/manager/evaluation-reports" element={<ManagerEvaluationReportsPage />} />
          <Route path="/manager/probation-extensions" element={<ManagerProbationExtensionsPage />} />
          <Route path="/manager/evaluation-unlock-requests" element={<ManagerEvaluationUnlockRequestsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

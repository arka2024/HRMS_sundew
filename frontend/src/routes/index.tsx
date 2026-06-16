import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../layouts/AppShell';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { HrDashboardPage } from '../pages/hr/HrDashboardPage';
import { HrEmployeesPage } from '../pages/hr/HrEmployeesPage';
import { HrReportsPage } from '../pages/hr/HrReportsPage';
import { ManagerDashboardPage } from '../pages/manager/ManagerDashboardPage';
import { ManagerEvaluationsPage } from '../pages/manager/ManagerEvaluationsPage';
import { ManagerTeamPage } from '../pages/manager/ManagerTeamPage';
import { ProtectedRoute, PublicRoute, RootRedirect } from './ProtectedRoute';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route path="/dashboard" element={<DashboardPage />} />

      <Route element={<ProtectedRoute allowedRole="hr" />}>
        <Route element={<AppShell />}>
          <Route path="/hr/dashboard" element={<HrDashboardPage />} />
          <Route path="/hr/employees" element={<HrEmployeesPage />} />
          <Route path="/hr/reports" element={<HrReportsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRole="manager" />}>
        <Route element={<AppShell />}>
          <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
          <Route path="/manager/team" element={<ManagerTeamPage />} />
          <Route path="/manager/evaluations" element={<ManagerEvaluationsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

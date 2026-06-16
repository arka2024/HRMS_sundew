import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardRouteForRole } from '../constants';

export function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return <Navigate to={getDashboardRouteForRole(user.role)} replace />;
}

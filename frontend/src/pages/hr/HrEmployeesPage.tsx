import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PageHeader } from '../../components/PageHeader';
import { ServiceError } from '../../components/ServiceError';
import { ROUTES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useEmployeeSyncRefresh } from '../../hooks/useEmployeeSyncRefresh';
import { employeeService, type SyncedEmployee } from '../../services/employee.service';
export function HrEmployeesPage() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<SyncedEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadEmployees = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await employeeService.getHrEmployees(token);
      setEmployees(data.employees);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load employees.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEmployeeSyncRefresh(loadEmployees, { enabled: Boolean(token), intervalMs: 15000 });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return employees;
    return employees.filter((employee) =>
      [employee.employeeNumber, employee.employeeName, employee.department, employee.projectName]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [employees, search]);

  if (isLoading) return <LoadingSpinner message="Loading employees..." />;

  if (error) {
    return <ServiceError message={error} onRetry={loadEmployees} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <PageHeader title="Employees" subtitle="Employee records imported from HR uploads — synced to Manager Portal" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="button" variant="outline" onClick={loadEmployees}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>refresh</span>
            Refresh
          </Button>
          <Link to={ROUTES.HR.EMPLOYEE_UPLOAD}>
            <Button type="button" variant="primary">
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>upload_file</span>
              Upload
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <div style={{ marginBottom: '16px', position: 'relative', maxWidth: '320px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: 'var(--text-muted)' }}>search</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employees..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Employee Number</th>
                <th>Name</th>
                <th>DOJ</th>
                <th>Hours</th>
                <th>Department</th>
                <th>Project</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '28px' }}>
                    No employees yet.{' '}
                    <Link to={ROUTES.HR.EMPLOYEE_UPLOAD}>Upload employee data</Link>
                  </td>
                </tr>
              ) : (
                filtered.map((employee) => (
                  <tr key={employee.employeeNumber}>
                    <td>{employee.employeeNumber}</td>
                    <td>{employee.employeeName}</td>
                    <td>{employee.dateOfJoining}</td>
                    <td>{employee.totalHoursWorked}</td>
                    <td>{employee.department}</td>
                    <td>{employee.projectName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

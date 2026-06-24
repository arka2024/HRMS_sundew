import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PageHeader } from '../../components/PageHeader';
import { ServiceError } from '../../components/ServiceError';
import { ROUTES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { useEmployeeSyncRefresh } from '../../hooks/useEmployeeSyncRefresh';
import { employeeService, type SyncedEmployee } from '../../services/employee.service';
import { slugifyEmployeeId } from '../../utils/employeeSyncEvents';
type SortKey = keyof Pick<
  SyncedEmployee,
  'employeeNumber' | 'employeeName' | 'dateOfJoining' | 'totalHoursWorked' | 'department' | 'projectName'
>;

type SortDirection = 'asc' | 'desc';

const pageSizeOptions = [5, 10, 20];

function compareValues(a: string | number, b: string | number) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

export function ManagerEmployeesPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<SyncedEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameSearch, setNameSearch] = useState('');
  const [numberSearch, setNumberSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('employeeNumber');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadEmployees = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await employeeService.getManagerEmployees(token);
      setEmployees(data.employees);
      setPage(1);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load employees.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEmployeeSyncRefresh(loadEmployees, { enabled: Boolean(token), intervalMs: 12000 });

  const filteredEmployees = useMemo(() => {
    const nameQuery = nameSearch.trim().toLowerCase();
    const numberQuery = numberSearch.trim().toLowerCase();

    const filtered = employees.filter((employee) => {
      const matchesName = !nameQuery || employee.employeeName.toLowerCase().includes(nameQuery);
      const matchesNumber = !numberQuery || employee.employeeNumber.toLowerCase().includes(numberQuery);
      return matchesName && matchesNumber;
    });

    return [...filtered].sort((left, right) => {
      const result = compareValues(left[sortKey], right[sortKey]);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [employees, nameSearch, numberSearch, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedEmployees = filteredEmployees.slice((safePage - 1) * pageSize, safePage * pageSize);

  function handleSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(nextKey);
      setSortDirection('asc');
    }
  }

  function renderSortLabel(label: string, key: SortKey) {
    return (
      <button
        type="button"
        onClick={() => handleSort(key)}
        style={{
          border: 'none',
          background: 'transparent',
          padding: 0,
          font: 'inherit',
          fontWeight: 800,
          color: 'inherit',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {label}
        {sortKey === key && (
          <span className="material-symbols-outlined" style={{ fontSize: '0.9rem' }}>
            {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
          </span>
        )}
      </button>
    );
  }

  function openEvaluation(employee: SyncedEmployee) {
    const slug = slugifyEmployeeId(employee.employeeName, employee.employeeNumber);
    navigate(`${ROUTES.MANAGER.DASHBOARD}?id=${slug}`);
  }



  if (isLoading) return <LoadingSpinner message="Loading team employees..." />;

  if (error) {
    return <ServiceError message={error} onRetry={loadEmployees} />;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <PageHeader
          title="Team Employees"
          subtitle={'Employees synced from HR Portal uploads'}
        />
        <Button type="button" variant="outline" onClick={loadEmployees}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>refresh</span>
          Refresh
        </Button>
      </div>

      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1rem',
                  color: 'var(--text-muted)',
                }}
              >
                person_search
              </span>
              <input
                value={nameSearch}
                onChange={(event) => {
                  setNameSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by name..."
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
            <div style={{ position: 'relative', minWidth: '220px', flex: 1 }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1rem',
                  color: 'var(--text-muted)',
                }}
              >
                badge
              </span>
              <input
                value={numberSearch}
                onChange={(event) => {
                  setNumberSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by employee number..."
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
          </div>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} rows
              </option>
            ))}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>{renderSortLabel('Employee Number', 'employeeNumber')}</th>
                <th>{renderSortLabel('Employee Name', 'employeeName')}</th>
                <th>{renderSortLabel('Date Of Joining', 'dateOfJoining')}</th>
                <th>{renderSortLabel('Total Hours', 'totalHoursWorked')}</th>
                <th>{renderSortLabel('Department', 'department')}</th>
                <th>{renderSortLabel('Project Name', 'projectName')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                      group_off
                    </span>
                    No employees found. Upload employee data in the HR Portal to sync records here.
                  </td>
                </tr>
              ) : (
                pagedEmployees.map((employee: SyncedEmployee) => (
                  <tr key={employee.employeeNumber}>
                    <td>{employee.employeeNumber}</td>
                    <td>{employee.employeeName}</td>
                    <td>{employee.dateOfJoining}</td>
                    <td>{employee.totalHoursWorked}</td>
                    <td>{employee.department}</td>
                    <td>{employee.projectName}</td>
                    <td>
                      <Button type="button" variant="ghost" onClick={() => openEvaluation(employee)}>
                        Evaluate
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing {pagedEmployees.length} of {filteredEmployees.length} employees
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              type="button"
              variant="outline"
              disabled={safePage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>chevron_left</span>
              Previous
            </Button>
            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>
              Page {safePage} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={safePage >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            >
              Next
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>chevron_right</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PageHeader } from '../../components/PageHeader';
import { ServiceError } from '../../components/ServiceError';
import { useAuth } from '../../contexts/AuthContext';
import { associateService } from '../../services/associate.service';
import type { ProcessedAssociate } from '../../types';

type SortKey = keyof Pick<
  ProcessedAssociate,
  | 'employeeId'
  | 'name'
  | 'designation'
  | 'dateOfJoining'
  | 'probationDurationMonths'
  | 'probationEndDate'
  | 'probationProgress'
  | 'monthsWorking'
  | 'taskCount'
>;

type SortDirection = 'asc' | 'desc';

const pageSizeOptions = [5, 10, 20];

function compareValues(a: string | number, b: string | number) {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

export function ManagerAssociatesPage() {
  const { token } = useAuth();
  const [associates, setAssociates] = useState<ProcessedAssociate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('employeeId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  function loadAssociates() {
    if (!token) return;
    setIsLoading(true);
    setError(null);

    associateService
      .getAssociates(token)
      .then((data) => {
        setAssociates(data.associates);
        setPage(1);
      })
      .catch((loadError) => {
        console.error('Failed to load processed associates:', loadError);
        setError(loadError instanceof Error ? loadError.message : 'Failed to load associates.');
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadAssociates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredAssociates = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? associates.filter((associate) =>
          [associate.employeeId, associate.name, associate.designation, associate.dateOfJoining, associate.probationEndDate]
            .join(' ')
            .toLowerCase()
            .includes(query),
        )
      : associates;

    return [...filtered].sort((left, right) => {
      const result = compareValues(left[sortKey], right[sortKey]);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [associates, search, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredAssociates.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedAssociates = filteredAssociates.slice((safePage - 1) * pageSize, safePage * pageSize);

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

  if (isLoading) return <LoadingSpinner message="Loading associate probation data..." />;

  if (error) {
    return <ServiceError message={error} onRetry={loadAssociates} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <PageHeader title="Associates" subtitle="Processed probation data from HR uploads" />
        <Button type="button" variant="outline" onClick={loadAssociates}>
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>refresh</span>
          Refresh
        </Button>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: '260px' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: 'var(--text-muted)' }}>search</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search associates..."
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
              <option key={size} value={size}>{size} rows</option>
            ))}
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>{renderSortLabel('Employee ID', 'employeeId')}</th>
                <th>{renderSortLabel('Name', 'name')}</th>
                <th>{renderSortLabel('Designation', 'designation')}</th>
                <th>{renderSortLabel('DOJ', 'dateOfJoining')}</th>
                <th>{renderSortLabel('Working', 'monthsWorking')}</th>
                <th>{renderSortLabel('Duration', 'probationDurationMonths')}</th>
                <th>{renderSortLabel('Probation End', 'probationEndDate')}</th>
                <th>{renderSortLabel('Progress', 'probationProgress')}</th>
                <th>{renderSortLabel('Task Count', 'taskCount')}</th>
              </tr>
            </thead>
            <tbody>
              {pagedAssociates.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '28px' }}>
                    No associates found.
                  </td>
                </tr>
              ) : (
                pagedAssociates.map((associate) => (
                  <tr key={associate.employeeId}>
                    <td>{associate.employeeId}</td>
                    <td>{associate.name}</td>
                    <td>{associate.designation || '-'}</td>
                    <td>{associate.dateOfJoining}</td>
                    <td>{associate.monthsWorking} months</td>
                    <td>{associate.probationDurationMonths} months</td>
                    <td>{associate.probationEndDate}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '140px' }}>
                        <div className="progress-bar-wrap" style={{ flex: 1 }}>
                          <div className="progress-bar" style={{ width: `${associate.probationProgress}%` }} />
                        </div>
                        <strong style={{ fontSize: '0.78rem' }}>{associate.probationProgress}%</strong>
                      </div>
                    </td>
                    <td>{associate.taskCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing {pagedAssociates.length} of {filteredAssociates.length} associates
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

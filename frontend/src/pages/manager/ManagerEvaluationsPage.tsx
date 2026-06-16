import { useState } from 'react';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Table } from '../../components/Table';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PageHeader } from '../../components/PageHeader';
import { ServiceError } from '../../components/ServiceError';
import { useAuth } from '../../contexts/AuthContext';
import { useApiData } from '../../hooks/useApiData';
import { managerService } from '../../services/manager.service';
import type { Evaluation } from '../../types';

export function ManagerEvaluationsPage() {
  const { token } = useAuth();
  const { data, isLoading, error, isServiceUnavailable, refetch } = useApiData(
    () => managerService.getEvaluations(token!),
    [token],
  );

  const [search, setSearch] = useState('');

  if (isLoading) return <LoadingSpinner message="Loading evaluations..." />;

  if (error) {
    return (
      <ServiceError
        message={error}
        onRetry={isServiceUnavailable ? refetch : undefined}
      />
    );
  }

  const filtered = (data?.evaluations || []).filter((e) =>
    e.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    e.status.toLowerCase().includes(search.toLowerCase()) ||
    e.period.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <PageHeader
          title="Evaluations Log"
          subtitle="Track and manage team performance reviews"
        />
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '8px 12px 8px 36px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              fontSize: '0.85rem',
              outline: 'none',
              background: 'var(--surface)',
            }}
          />
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', color: 'var(--text-muted)' }}>search</span>
        </div>
      </div>

      <Card>
        <Table<Evaluation>
          data={filtered}
          keyExtractor={(evaluation) => evaluation.id}
          columns={[
            { header: 'Employee', accessor: 'employeeName' },
            { header: 'Period', accessor: 'period' },
            {
              header: 'Status',
              accessor: (evaluation) => (
                <Badge variant={evaluation.status === 'Completed' ? 'success' : 'warning'}>
                  {evaluation.status}
                </Badge>
              ),
            },
            {
              header: 'Score',
              accessor: (evaluation) => evaluation.score ? evaluation.score.toFixed(2) : '—',
            },
          ]}
        />
      </Card>
    </div>
  );
}


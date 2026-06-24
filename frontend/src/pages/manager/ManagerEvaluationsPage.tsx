import { useState } from 'react';
import { motion } from 'framer-motion';
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
  const [selectedStatus, setSelectedStatus] = useState('all');

  if (isLoading) return <LoadingSpinner message="Loading evaluations..." />;

  if (error) {
    return (
      <ServiceError
        message={error}
        onRetry={isServiceUnavailable ? refetch : undefined}
      />
    );
  }

  const filtered = (data?.evaluations || []).filter((e) => {
    const matchesSearch = 
      e.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      e.status.toLowerCase().includes(search.toLowerCase()) ||
      e.period.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || e.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const STATUS_FILTERS = [
    { id: 'all', label: 'All Status' },
    { id: 'Completed', label: 'Completed' },
    { id: 'Pending', label: 'Pending' },
    { id: 'In Review', label: 'In Review' },
    { id: 'Locked', label: 'Locked' },
  ];

  return (
    <div>
      <PageHeader
        title="Evaluations Log"
        subtitle="Track and manage team performance reviews"
      />

      <motion.div
        style={{ marginBottom: '20px' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
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
                width: '100%',
              }}
            />
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', color: 'var(--text-muted)' }}>search</span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`date-filter-btn ${selectedStatus === filter.id ? 'active' : ''}`}
                onClick={() => setSelectedStatus(filter.id)}
                style={{ fontSize: '0.85rem', padding: '6px 12px' }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <Table<Evaluation>
            data={filtered}
            keyExtractor={(evaluation) => evaluation.id}
            columns={[
              {
                header: 'Employee',
                accessor: (evaluation) => (
                  <div>
                    <strong style={{ fontWeight: 600, color: 'var(--text)' }}>{evaluation.employeeName}</strong>
                  </div>
                ),
              },
              { header: 'Period', accessor: 'period' },
              {
                header: 'Status',
                accessor: (evaluation) => (
                  <Badge variant={evaluation.status === 'Completed' ? 'success' : evaluation.status === 'Locked' ? 'success' : evaluation.status === 'Pending' ? 'danger' : 'warning'}>
                    {evaluation.status}
                  </Badge>
                ),
              },
              {
                header: 'Score',
                accessor: (evaluation) => (
                  <Badge variant={evaluation.score >= 4 ? 'success' : evaluation.score >= 3 ? 'warning' : 'danger'}>
                    {evaluation.score ? evaluation.score.toFixed(2) : '—'}
                  </Badge>
                ),
              },
            ]}
          />
        </Card>
      </motion.div>
    </div>
  );
}


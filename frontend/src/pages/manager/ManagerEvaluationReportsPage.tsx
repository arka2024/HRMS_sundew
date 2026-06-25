import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Table } from '../../components/Table';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PageHeader } from '../../components/PageHeader';
import { ServiceError } from '../../components/ServiceError';
import { useAuth } from '../../contexts/AuthContext';
import { evaluationReportService } from '../../services/evaluation-report.service';
import type { EvaluationReport } from '../../types';
import type { EvaluationDashboardStats } from '../../services/evaluation-report.service';

export function ManagerEvaluationReportsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<EvaluationDashboardStats | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  function loadData() {
    setIsLoading(true);
    setError(null);

    Promise.all([
      evaluationReportService.getDashboardStats(token!),
      evaluationReportService.getEvaluations(token!, {
        period: selectedPeriod === 'all' ? undefined : selectedPeriod as any,
        status: selectedStatus === 'all' ? undefined : selectedStatus
      })
    ])
      .then(([statsData, evalsData]) => {
        setStats(statsData);
        setEvaluations(evalsData.evaluations);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load evaluation reports:', err);
        setError('Failed to connect to evaluation reports service.');
        setIsLoading(false);
      });
  }

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, selectedPeriod, selectedStatus]);

  function handleExportPDF() {
    evaluationReportService.exportPDF(token!)
      .then(() => {
        toast.success('PDF exported successfully');
      })
      .catch((err) => {
        toast.error('Failed to export PDF');
        console.error(err);
      });
  }

  function handleExportExcel() {
    evaluationReportService.exportExcel(token!)
      .then(() => {
        toast.success('Excel exported successfully');
      })
      .catch((err) => {
        toast.error('Failed to export Excel');
        console.error(err);
      });
  }

  const PERIOD_FILTERS = [
    { id: 'all', label: 'All Time' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' },
    { id: 'yearly', label: 'Yearly' },
  ];

  const STATUS_FILTERS = [
    { id: 'all', label: 'All Status' },
    { id: 'Draft', label: 'Draft' },
    { id: 'Completed', label: 'Completed' },
    { id: 'Locked', label: 'Locked' },
  ];

  if (isLoading) {
    return <LoadingSpinner message="Loading evaluation reports..." />;
  }

  if (error) {
    return <ServiceError message={error} onRetry={loadData} />;
  }

  return (
    <div>
      <PageHeader
        title="Team Evaluation Reports"
        subtitle="View evaluation reports for your team members"
      />

      {/* Dashboard Stats */}
      <div className="stats-grid">
        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="stat-icon" style={{ background: 'var(--primary)', color: 'white' }}>
            <span className="material-symbols-outlined">people</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.totalEvaluatedEmployees || 0}</div>
            <div className="stat-label">Evaluated Employees</div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="stat-icon" style={{ background: '#f59e0b', color: 'white' }}>
            <span className="material-symbols-outlined">pending</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.pendingEvaluations || 0}</div>
            <div className="stat-label">Pending Evaluations</div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="stat-icon" style={{ background: '#10b981', color: 'white' }}>
            <span className="material-symbols-outlined">lock</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.lockedEvaluations || 0}</div>
            <div className="stat-label">Locked Cycles</div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="stat-icon" style={{ background: '#8b5cf6', color: 'white' }}>
            <span className="material-symbols-outlined">star</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.averageRating?.toFixed(2) || '0.00'}</div>
            <div className="stat-label">Average Rating</div>
          </div>
        </motion.div>
      </div>

      {/* Filters and Actions */}
      <motion.div
        className="panel-header"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <div className="panel-header-left">
          <h3>Evaluation Reports</h3>
          <div className="date-filters">
            {PERIOD_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`date-filter-btn ${selectedPeriod === filter.id ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="date-filters">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`date-filter-btn ${selectedStatus === filter.id ? 'active' : ''}`}
                onClick={() => setSelectedStatus(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="button" variant="outline" onClick={handleExportPDF}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
              picture_as_pdf
            </span>
            Export PDF
          </Button>
          <Button type="button" variant="outline" onClick={handleExportExcel}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
              table_chart
            </span>
            Export Excel
          </Button>
        </div>
      </motion.div>

      {/* Reports Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <Table<EvaluationReport>
            data={evaluations.slice(0, 10)}
            keyExtractor={(evaluation) => `${evaluation.employeeId}-${evaluation.evaluationMonth}`}
            columns={[
              {
                header: 'Employee',
                accessor: (evaluation) => (
                  <div>
                    <strong style={{ fontWeight: 600, color: 'var(--text)' }}>{evaluation.employeeName}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{evaluation.employeeId}</div>
                  </div>
                ),
              },
              {
                header: 'Department',
                accessor: (evaluation) => <span style={{ color: 'var(--text-muted)' }}>{evaluation.department}</span>,
              },
              {
                header: 'Project',
                accessor: (evaluation) => <span style={{ color: 'var(--text-muted)' }}>{evaluation.project}</span>,
              },
              {
                header: 'Period',
                accessor: (evaluation) => (
                  <div>
                    <div style={{ fontWeight: 500 }}>{evaluation.evaluationMonth} {evaluation.evaluationYear}</div>
                  </div>
                ),
              },
              {
                header: 'Overall Score',
                accessor: (evaluation) => (
                  <Badge variant={evaluation.overallScore >= 4 ? 'success' : evaluation.overallScore >= 3 ? 'warning' : 'danger'}>
                    {evaluation.overallScore.toFixed(2)}
                  </Badge>
                ),
              },
              {
                header: 'Status',
                accessor: (evaluation) => (
                  <Badge variant={evaluation.status === 'Locked' ? 'success' : evaluation.status === 'Completed' ? 'warning' : 'danger'}>
                    {evaluation.status}
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

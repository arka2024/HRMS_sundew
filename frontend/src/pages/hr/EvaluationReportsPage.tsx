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
import { evaluationReportService, type EvaluationReport, type EvaluationDashboardStats } from '../../services/evaluation-report.service';

export function EvaluationReportsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<EvaluationDashboardStats | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  async function loadData() {
    setIsLoading(true);
    setError(null);

    try {
      // Load dashboard stats with filters
      try {
        const filters: any = {};
        if (selectedPeriod !== 'all') filters.period = selectedPeriod;
        if (selectedMonths.length > 0) filters.months = selectedMonths.join(',');
        if (customStartDate && customEndDate) {
          filters.startDate = customStartDate;
          filters.endDate = customEndDate;
        }
        
        const statsData = await evaluationReportService.getDashboardStats(token!, filters);
        setStats(statsData);
      } catch (err) {
        console.error('Failed to load evaluation stats:', err);
        // Don't set overall error, just keep existing or default stats
      }

      // Load evaluations with filters
      try {
        const filters: any = {};
        if (selectedPeriod !== 'all') filters.period = selectedPeriod;
        if (selectedStatus !== 'all') filters.status = selectedStatus;
        if (selectedMonths.length > 0) filters.months = selectedMonths.join(',');
        if (customStartDate && customEndDate) {
          filters.startDate = customStartDate;
          filters.endDate = customEndDate;
        }
        
        const evalsData = await evaluationReportService.getEvaluations(token!, filters);
        setEvaluations(evalsData.evaluations);
      } catch (err) {
        console.error('Failed to load evaluations:', err);
        // Don't set overall error
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, selectedPeriod, selectedStatus, selectedMonths, customStartDate, customEndDate]);

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

  function handleSeedEvaluations() {
    evaluationReportService.seedEvaluations(token!)
      .then(() => {
        toast.success('Sample evaluations seeded successfully');
        loadData();
      })
      .catch((err) => {
        toast.error('Failed to seed evaluations');
        console.error(err);
      });
  }

  function handleLockEvaluation(employeeId: string, monthKey: string) {
    evaluationReportService.lockEvaluation(token!, employeeId, monthKey)
      .then(() => {
        toast.success('Evaluation locked successfully');
        loadData();
      })
      .catch((err) => {
        toast.error('Failed to lock evaluation');
        console.error(err);
      });
  }

  function handleUnlockEvaluation(employeeId: string, monthKey: string) {
    evaluationReportService.unlockEvaluation(token!, employeeId, monthKey)
      .then(() => {
        toast.success('Evaluation unlocked successfully');
        loadData();
      })
      .catch((err) => {
        toast.error('Failed to unlock evaluation');
        console.error(err);
      });
  }

  const PERIOD_FILTERS = [
    { id: 'all', label: 'All Time' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' },
    { id: 'yearly', label: 'Yearly' },
    { id: 'custom', label: 'Custom Range' },
  ];

  const STATUS_FILTERS = [
    { id: 'all', label: 'All Status' },
    { id: 'Pending', label: 'Pending' },
    { id: 'In Review', label: 'In Review' },
    { id: 'Completed', label: 'Completed' },
    { id: 'Locked', label: 'Locked' },
  ];

  const MONTH_OPTIONS = [
    '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
    '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'
  ];

  function toggleMonth(month: string) {
    setSelectedMonths(prev => 
      prev.includes(month) 
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading evaluation reports..." />;
  }

  if (error) {
    return <ServiceError message={error} onRetry={loadData} />;
  }

  return (
    <div>
      <PageHeader
        title="Evaluation Reports"
        subtitle="View and manage employee evaluation reports"
      />

      {/* Dashboard Stats */}
      <div className="stats-grid">
        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
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
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
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
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <div className="stat-icon" style={{ background: '#3b82f6', color: 'white' }}>
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.completedEvaluations || 0}</div>
            <div className="stat-label">Completed Evaluations</div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <div className="stat-icon" style={{ background: '#10b981', color: 'white' }}>
            <span className="material-symbols-outlined">lock</span>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.lockedEvaluations || 0}</div>
            <div className="stat-label">Locked Evaluations</div>
          </div>
        </motion.div>

        <motion.div
          className="stat-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
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
          {selectedPeriod === 'custom' && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: '16px' }}>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '4px' }}
              />
              <span style={{ color: 'var(--text-muted)' }}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{ padding: '4px 8px', border: '1px solid var(--border)', borderRadius: '4px' }}
              />
            </div>
          )}
          {selectedPeriod === 'all' && (
            <div style={{ marginLeft: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {MONTH_OPTIONS.slice(0, 6).map((month) => (
                <button
                  key={month}
                  type="button"
                  className={`date-filter-btn ${selectedMonths.includes(month) ? 'active' : ''}`}
                  onClick={() => toggleMonth(month)}
                  style={{ fontSize: '0.85rem', padding: '4px 8px' }}
                >
                  {month}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="button" variant="outline" onClick={handleSeedEvaluations}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
              refresh
            </span>
            Seed Data
          </Button>
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
                header: 'Manager',
                accessor: (evaluation) => <span style={{ color: 'var(--text-muted)' }}>{evaluation.managerId}</span>,
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
                header: 'Remarks',
                accessor: (evaluation) => (
                  <span style={{ 
                    color: 'var(--text-muted)', 
                    fontSize: '0.85rem',
                    maxWidth: '200px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block'
                  }}>
                    {evaluation.hrRemarks || '-'}
                  </span>
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
              {
                header: 'Locked',
                accessor: (evaluation) => (
                  <span style={{ 
                    color: evaluation.status === 'Locked' ? '#10b981' : 'var(--text-muted)',
                    fontSize: '0.85rem'
                  }}>
                    {evaluation.status === 'Locked' ? 'Yes' : 'No'}
                  </span>
                ),
              },
              {
                header: 'Actions',
                accessor: (evaluation) => (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {evaluation.status !== 'Locked' && (
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => handleLockEvaluation(evaluation.employeeId, `${evaluation.evaluationYear}-${evaluation.evaluationMonth}`)}
                        title="Lock Evaluation"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>lock</span>
                      </button>
                    )}
                    {evaluation.status === 'Locked' && (
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => handleUnlockEvaluation(evaluation.employeeId, `${evaluation.evaluationYear}-${evaluation.evaluationMonth}`)}
                        title="Unlock Evaluation"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>lock_open</span>
                      </button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </motion.div>
    </div>
  );
}

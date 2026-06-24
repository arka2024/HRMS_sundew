import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '../../components/Button';
import { Table } from '../../components/Table';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ServiceError } from '../../components/ServiceError';
import { HrQuickAccessPanel } from '../../components/hr/HrQuickAccessPanel';
import { HrEmployeeSyncPanel } from '../../components/hr/HrEmployeeSyncPanel';
import { MonthlyDocumentTally } from '../../components/hr/MonthlyDocumentTally';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { hrService, type HrDocument, type HrActivity } from '../../services/hr.service';
import { evaluationReportService, type EvaluationDashboardStats } from '../../services/evaluation-report.service';

function getFileIcon(type: string) {
  if (type.includes('PDF')) return { icon: 'picture_as_pdf', color: '#ef4444' };
  if (type.includes('Word')) return { icon: 'description', color: '#3b82f6' };
  if (type.includes('Excel')) return { icon: 'table_chart', color: '#10b981' };
  if (type.includes('Image') || type.includes('Media')) return { icon: 'image', color: '#8b5cf6' };
  if (type.includes('CSV')) return { icon: 'csv', color: '#14b8a6' };
  if (type.includes('Zip')) return { icon: 'folder_zip', color: '#f59e0b' };
  return { icon: 'draft', color: 'var(--text-muted)' };
}

function getActivityIcon(action: string) {
  if (action === 'uploaded') return 'upload_file';
  if (action.includes('imported employees')) return 'group_add';
  if (action.includes('deleted')) return 'delete';
  if (action.includes('updated')) return 'edit_document';
  return 'download';
}

export function HrDashboardPage() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [documents, setDocuments] = useState<HrDocument[]>([]);
  const [activities, setActivities] = useState<HrActivity[]>([]);
  const [evaluationStats, setEvaluationStats] = useState<EvaluationDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('all');

  async function loadDashboardData() {
    setIsLoading(true);
    setError(null);

    try {
      // Load documents
      try {
        const docsData = await hrService.getDocuments(token!);
        setDocuments(docsData.documents);
      } catch (err) {
        console.error('Failed to load documents:', err);
      }

      // Load activity
      try {
        const activityData = await hrService.getActivity(token!);
        setActivities(activityData.activities);
      } catch (err) {
        console.error('Failed to load activity:', err);
      }

      // Load evaluation stats
      try {
        const evalStats = await evaluationReportService.getDashboardStats(token!);
        setEvaluationStats(evalStats);
      } catch (err) {
        console.error('Failed to load evaluation stats:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handleDownload(docName: string) {
    toast.success(`Downloading ${docName}...`);
  }

  const DATE_FILTERS = [
    { id: 'today', label: 'Today' },
    { id: 'last7days', label: 'Last 7 Days' },
    { id: 'last30days', label: 'Last 30 Days' },
    { id: 'custom', label: 'Custom Range' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'quarterly', label: 'Quarterly' },
    { id: 'yearly', label: 'Yearly' },
  ];

  const filteredDocuments = documents.slice(0, 10);
  const filteredActivities = activities.slice(0, 10);

  if (isLoading) {
    return <LoadingSpinner message="Loading Sundew Elevate workspace..." />;
  }

  if (error) {
    return <ServiceError message={error} onRetry={loadDashboardData} />;
  }

  return (
    <div className="hr-dashboard-layout">
      <div className="hr-dashboard-main">
        <motion.div
          className="hr-page-header"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <h2>HR Dashboard</h2>
            <p>Manage employee evaluations and HR operations.</p>
          </div>
        </motion.div>

        {/* Evaluation Reports Card */}
        <motion.div
          className="elevate-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="panel-header">
            <h3>Evaluation Reports</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  try {
                    await evaluationReportService.seedEvaluations(token!);
                    toast.success('Evaluations seeded successfully!');
                    loadDashboardData();
                  } catch (err) {
                    toast.error('Failed to seed evaluations');
                    console.error(err);
                  }
                }}
              >
                Seed Data
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/hr/evaluation-reports')}
              >
                View All Reports
              </Button>
            </div>
          </div>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div className="stat-item">
              <div className="stat-value">{evaluationStats?.totalEvaluatedEmployees || 0}</div>
              <div className="stat-label">Total Evaluated</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{evaluationStats?.pendingEvaluations || 0}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{evaluationStats?.lockedEvaluationCycles || 0}</div>
              <div className="stat-label">Locked Cycles</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{evaluationStats?.averageRating?.toFixed(2) || '0.00'}</div>
              <div className="stat-label">Avg Rating</div>
            </div>
          </div>
        </motion.div>

        <MonthlyDocumentTally />

        <motion.div
          className="elevate-panel elevate-documents-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="panel-header">
            <div className="panel-header-left">
              <h3>Recent Documents</h3>
              <div className="date-filters">
                {DATE_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    className={`date-filter-btn ${selectedFilter === filter.id ? 'active' : ''}`}
                    onClick={() => setSelectedFilter(filter.id)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button type="button" className="top-navbar-btn" style={{ width: '32px', height: '32px' }}>
                <span className="material-symbols-outlined">view_list</span>
              </button>
              <button type="button" className="top-navbar-btn" style={{ width: '32px', height: '32px' }}>
                <span className="material-symbols-outlined">view_comfy</span>
              </button>
              <button
                type="button"
                className="view-all-link"
                onClick={() => toast.success('Opening full document history...')}
              >
                View All
              </button>
            </div>
          </div>

          <Table<HrDocument>
            data={filteredDocuments}
            keyExtractor={(doc) => doc.id}
            onRowClick={(doc) => handleDownload(doc.name)}
            columns={[
              {
                header: 'Name',
                accessor: (doc) => {
                  const { icon, color } = getFileIcon(doc.type);
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="material-symbols-outlined" style={{ color }}>
                        {icon}
                      </span>
                      <strong style={{ fontWeight: 600, color: 'var(--text)' }}>{doc.name}</strong>
                    </div>
                  );
                },
              },
              {
                header: 'Type',
                accessor: (doc) => <span style={{ color: 'var(--text-muted)' }}>{doc.type}</span>,
              },
              {
                header: 'Date Added',
                accessor: (doc) => <span style={{ color: 'var(--text-muted)' }}>{doc.dateAdded}</span>,
              },
              {
                header: 'Owner',
                accessor: (doc) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {doc.avatar ? (
                      <img
                        src={doc.avatar}
                        alt={doc.owner}
                        style={{ width: '22px', height: '22px', borderRadius: '50%' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                          color: 'white',
                          fontSize: '0.65rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                        }}
                      >
                        {doc.owner.charAt(0)}
                      </div>
                    )}
                    <span style={{ fontSize: '0.85rem' }}>{doc.owner}</span>
                  </div>
                ),
              },
            ]}
          />
        </motion.div>
      </div>

      <aside className="hr-dashboard-sidebar">
        <HrEmployeeSyncPanel />
        <HrQuickAccessPanel />

        <motion.div
          className="elevate-panel elevate-activity-feed"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="panel-header">
            <h3>Recent Activity</h3>
            <button
              type="button"
              className="view-all-link"
              onClick={() => toast.success('Opening full activity history...')}
            >
              View All
            </button>
          </div>
          <div className="activity-stream">
            {filteredActivities.map((act) => (
              <div key={act.id} className="activity-item">
                <div className="activity-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>
                    {getActivityIcon(act.action)}
                  </span>
                </div>
                <div className="activity-content">
                  <p style={{ margin: 0 }}>
                    <strong>{act.user}</strong> {act.action}{' '}
                    <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{act.target}</span>
                  </p>
                  <div className="activity-time">{act.time}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="elevate-audit-link"
            onClick={() => toast.success('Opening full audit log...')}
          >
            View Full Audit Log
          </button>
        </motion.div>

        <motion.div
          className="elevate-panel elevate-promo promo-banner"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <h3>Secure E-Signatures</h3>
          <p>Send handbooks and contracts for digital approval with enterprise-grade security.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => toast.success('Opening e-signature configuration...')}
          >
            Learn More
          </Button>
        </motion.div>
      </aside>
    </div>
  );
}

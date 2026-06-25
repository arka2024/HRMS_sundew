import { useCallback, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PageHeader } from '../../components/PageHeader';
import { ServiceError } from '../../components/ServiceError';
import { Badge } from '../../components/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { evaluationReportService } from '../../services/evaluation-report.service';
import type { ProbationExtension } from '../../types';

export function HrProbationExtensionsPage() {
  const { token } = useAuth();
  const [extensions, setExtensions] = useState<ProbationExtension[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState<ProbationExtension | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadExtensions = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await evaluationReportService.getProbationExtensions(token);
      setExtensions(data.extensions || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load extensions');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadExtensions();
  }, [loadExtensions]);

  const handleApprove = async (extension: ProbationExtension) => {
    if (!token) return;
    try {
      await evaluationReportService.approveProbationExtension(token, extension._id!);
      toast.success('Probation extension approved successfully');
      loadExtensions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Approval failed';
      toast.error(message);
    }
  };

  const handleOpenRejectModal = (extension: ProbationExtension) => {
    setSelectedExtension(extension);
    setRejectionReason('');
    setIsModalOpen(true);
  };

  const handleReject = async () => {
    if (!token || !selectedExtension) return;
    try {
      await evaluationReportService.rejectProbationExtension(token, selectedExtension._id!, rejectionReason);
      toast.success('Probation extension rejected successfully');
      setIsModalOpen(false);
      loadExtensions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Rejection failed';
      toast.error(message);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'danger';
      case 'Pending':
      default:
        return 'warning';
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading probation extensions..." />;
  if (error) return <ServiceError message={error} onRetry={loadExtensions} />;

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
        <PageHeader title="Probation Extensions" subtitle="Review and manage probation extension requests" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="button" variant="outline" onClick={loadExtensions}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>refresh</span>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Employee Number</th>
                <th>Employee Name</th>
                <th>Duration (Months)</th>
                <th>Reason</th>
                <th>Requested By</th>
                <th>Requested Date</th>
                <th>Manager Approved</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {extensions.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '28px' }}>
                    No probation extension requests found.
                  </td>
                </tr>
              ) : (
                extensions.map((extension) => (
                  <tr key={extension._id}>
                    <td>{extension.employeeNumber}</td>
                    <td>{extension.employeeName}</td>
                    <td>{extension.durationMonths}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {extension.reason}
                    </td>
                    <td>{extension.requestedBy}</td>
                    <td>{new Date(extension.requestedDate).toLocaleDateString()}</td>
                    <td>
                      {extension.managerApproved ? (
                        <Badge variant="success">Yes</Badge>
                      ) : (
                        <Badge variant="warning">No</Badge>
                      )}
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(extension.status)}>
                        {extension.status}
                      </Badge>
                    </td>
                    <td>
                      {extension.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Button type="button" variant="outline" onClick={() => handleApprove(extension)}>
                            Approve
                          </Button>
                          <Button type="button" variant="outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleOpenRejectModal(extension)}>
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Reject Probation Extension</h3>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                ✕
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="rejectionReason" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  Rejection Reason *
                </label>
                <textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  rows={4}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    resize: 'vertical',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="primary" style={{ background: 'var(--danger)' }} onClick={handleReject} disabled={!rejectionReason.trim()}>
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

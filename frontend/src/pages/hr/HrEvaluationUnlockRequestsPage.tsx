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
import type { EvaluationUnlockRequest } from '../../types';

export function HrEvaluationUnlockRequestsPage() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<EvaluationUnlockRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<EvaluationUnlockRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadRequests = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await evaluationReportService.getEvaluationUnlockRequests(token);
      setRequests(data.requests || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = async (request: EvaluationUnlockRequest) => {
    if (!token) return;
    try {
      await evaluationReportService.approveEvaluationUnlockRequest(token, request._id!);
      toast.success('Evaluation unlock request approved and evaluation unlocked');
      loadRequests();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Approval failed';
      toast.error(message);
    }
  };

  const handleOpenRejectModal = (request: EvaluationUnlockRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setIsModalOpen(true);
  };

  const handleReject = async () => {
    if (!token || !selectedRequest) return;
    try {
      await evaluationReportService.rejectEvaluationUnlockRequest(token, selectedRequest._id!, rejectionReason);
      toast.success('Evaluation unlock request rejected');
      setIsModalOpen(false);
      loadRequests();
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

  if (isLoading) return <LoadingSpinner message="Loading evaluation unlock requests..." />;
  if (error) return <ServiceError message={error} onRetry={loadRequests} />;

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
        <PageHeader title="Evaluation Unlock Requests" subtitle="Review and manage evaluation unlock requests" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="button" variant="outline" onClick={loadRequests}>
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
                <th>Evaluation Period</th>
                <th>Reason</th>
                <th>Requested By</th>
                <th>Requested Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '28px' }}>
                    No evaluation unlock requests found.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request._id}>
                    <td>{request.employeeNumber}</td>
                    <td>{request.employeeName}</td>
                    <td>{request.evaluationMonth} {request.evaluationYear}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {request.reason}
                    </td>
                    <td>{request.requestedBy}</td>
                    <td>{new Date(request.requestedDate).toLocaleDateString()}</td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status}
                      </Badge>
                    </td>
                    <td>
                      {request.status === 'Pending' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <Button type="button" variant="outline" onClick={() => handleApprove(request)}>
                            Approve
                          </Button>
                          <Button type="button" variant="outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleOpenRejectModal(request)}>
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
              <h3 style={{ margin: 0 }}>Reject Evaluation Unlock Request</h3>
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

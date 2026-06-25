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
import { managerService, type Associate } from '../../services/manager.service';

export function ManagerEvaluationUnlockRequestsPage() {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState<EvaluationUnlockRequest[]>([]);
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssociate, setSelectedAssociate] = useState<Associate | null>(null);
  const [formData, setFormData] = useState({
    evaluationYear: new Date().getFullYear().toString(),
    evaluationMonth: String(new Date().getMonth() + 1).padStart(2, '0'),
    reason: '',
  });

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [associatesRes, requestsRes] = await Promise.all([
        managerService.getAssociates(token),
        evaluationReportService.getEvaluationUnlockRequests(token),
      ]);
      setAssociates(associatesRes);
      setRequests(requestsRes.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateModal = (associate: Associate) => {
    setSelectedAssociate(associate);
    setFormData({
      evaluationYear: new Date().getFullYear().toString(),
      evaluationMonth: String(new Date().getMonth() + 1).padStart(2, '0'),
      reason: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedAssociate) return;
    try {
      await evaluationReportService.createEvaluationUnlockRequest(token, {
        employeeNumber: selectedAssociate.employeeNumber,
        employeeName: selectedAssociate.name,
        evaluationYear: formData.evaluationYear,
        evaluationMonth: formData.evaluationMonth,
        reason: formData.reason,
        requestedBy: user?.name || 'Manager',
      });
      toast.success('Evaluation unlock request submitted');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit request';
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
  if (error) return <ServiceError message={error} onRetry={loadData} />;

  return (
    <div>
      <PageHeader title="Evaluation Unlock Requests" subtitle="Request unlock for locked evaluations" />
      
      <Card>
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '12px' }}>Request Unlock for Associate</h4>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {associates.map((associate) => (
              <Button
                key={associate.id}
                variant="outline"
                onClick={() => handleOpenCreateModal(associate)}
              >
                {associate.name}
              </Button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Evaluation Period</th>
                <th>Reason</th>
                <th>Requested Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '28px' }}>
                    No evaluation unlock requests found.
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr key={request._id}>
                    <td>{request.employeeName}</td>
                    <td>{request.evaluationMonth} {request.evaluationYear}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {request.reason}
                    </td>
                    <td>{new Date(request.requestedDate).toLocaleDateString()}</td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && selectedAssociate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Request Evaluation Unlock</h3>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                ✕
              </Button>
            </div>
            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--surface)', borderRadius: '8px' }}>
              <strong>{selectedAssociate.name}</strong> ({selectedAssociate.employeeNumber})
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <label htmlFor="year" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Year
                  </label>
                  <input
                    id="year"
                    type="number"
                    min="2020"
                    max="2030"
                    value={formData.evaluationYear}
                    onChange={(e) => setFormData({ ...formData, evaluationYear: e.target.value })}
                    required
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <label htmlFor="month" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    Month
                  </label>
                  <select
                    id="month"
                    value={formData.evaluationMonth}
                    onChange={(e) => setFormData({ ...formData, evaluationMonth: e.target.value })}
                    required
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                    }}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={String(m).padStart(2, '0')}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="reason" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  Reason
                </label>
                <textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
                <Button type="submit" variant="primary">
                  Submit Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

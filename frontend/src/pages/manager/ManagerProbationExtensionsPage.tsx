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
import { managerService, type Associate } from '../../services/manager.service';

export function ManagerProbationExtensionsPage() {
  const { token, user } = useAuth();
  const [extensions, setExtensions] = useState<ProbationExtension[]>([]);
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssociate, setSelectedAssociate] = useState<Associate | null>(null);
  const [formData, setFormData] = useState({
    durationMonths: 1,
    reason: '',
  });

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [associatesRes, extensionsRes] = await Promise.all([
        managerService.getAssociates(token),
        evaluationReportService.getProbationExtensions(token),
      ]);
      setAssociates(associatesRes);
      setExtensions(extensionsRes.extensions || []);
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
      durationMonths: 1,
      reason: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedAssociate) return;
    try {
      await evaluationReportService.createProbationExtension(token, {
        employeeNumber: selectedAssociate.employeeNumber,
        employeeName: selectedAssociate.name,
        durationMonths: formData.durationMonths,
        reason: formData.reason,
        requestedBy: user?.name || 'Manager',
      });
      toast.success('Probation extension request submitted');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit request';
      toast.error(message);
    }
  };

  const handleApproveAsManager = async (extension: ProbationExtension) => {
    if (!token) return;
    try {
      await evaluationReportService.approveProbationExtensionByManager(token, extension._id!);
      toast.success('Probation extension approved by manager');
      loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Approval failed';
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
  if (error) return <ServiceError message={error} onRetry={loadData} />;

  return (
    <div>
      <PageHeader title="Probation Extensions" subtitle="Request probation extensions for your associates" />
      
      <Card>
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ marginBottom: '12px' }}>Request Extension for Associate</h4>
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
                <th>Duration</th>
                <th>Reason</th>
                <th>Requested Date</th>
                <th>Manager Approval</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {extensions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '28px' }}>
                    No probation extension requests found.
                  </td>
                </tr>
              ) : (
                extensions.map((extension) => (
                  <tr key={extension._id}>
                    <td>{extension.employeeName}</td>
                    <td>{extension.durationMonths} months</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {extension.reason}
                    </td>
                    <td>{new Date(extension.requestedDate).toLocaleDateString()}</td>
                    <td>
                      {!extension.managerApproved && extension.status === 'Pending' ? (
                        <Button variant="outline" onClick={() => handleApproveAsManager(extension)}>
                          Approve
                        </Button>
                      ) : (
                        <Badge variant={extension.managerApproved ? 'success' : 'warning'}>
                          {extension.managerApproved ? 'Approved' : 'Pending'}
                        </Badge>
                      )}
                    </td>
                    <td>
                      <Badge variant={getStatusBadgeVariant(extension.status)}>
                        {extension.status}
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
              <h3 style={{ margin: 0 }}>Request Probation Extension</h3>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                ✕
              </Button>
            </div>
            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--surface)', borderRadius: '8px' }}>
              <strong>{selectedAssociate.name}</strong> ({selectedAssociate.employeeNumber})
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="duration" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  Duration (months)
                </label>
                <input
                  id="duration"
                  type="number"
                  min="1"
                  max="6"
                  value={formData.durationMonths}
                  onChange={(e) => setFormData({ ...formData, durationMonths: parseInt(e.target.value) || 1 })}
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

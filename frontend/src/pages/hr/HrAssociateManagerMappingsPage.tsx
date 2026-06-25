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
import type { AssociateManagerMapping } from '../../types';
import { probationService } from '../../services/probation.service';
import type { Employee, Manager } from '../../types';

export function HrAssociateManagerMappingsPage() {
  const { token } = useAuth();
  const [mappings, setMappings] = useState<AssociateManagerMapping[]>([]);
  const [associates, setAssociates] = useState<Employee[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<AssociateManagerMapping | null>(null);
  const [formData, setFormData] = useState({
    associateEmployeeNumber: '',
    associateName: '',
    managerEmployeeNumber: '',
    managerName: '',
  });

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [mappingsRes, employeesRes, managersRes] = await Promise.all([
        evaluationReportService.getAssociateManagerMappings(token),
        probationService.getEmployees(token),
        probationService.getManagers(token),
      ]);
      setMappings(mappingsRes.mappings || []);
      setAssociates(employeesRes.employees || []);
      setManagers(managersRes.managers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateModal = () => {
    setEditingMapping(null);
    setFormData({
      associateEmployeeNumber: '',
      associateName: '',
      managerEmployeeNumber: '',
      managerName: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mapping: AssociateManagerMapping) => {
    setEditingMapping(mapping);
    setFormData({
      associateEmployeeNumber: mapping.associateEmployeeNumber,
      associateName: mapping.associateName,
      managerEmployeeNumber: mapping.managerEmployeeNumber,
      managerName: mapping.managerName,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      if (editingMapping) {
        await evaluationReportService.updateAssociateManagerMapping(token, editingMapping._id!, formData);
        toast.success('Mapping updated successfully');
      } else {
        await evaluationReportService.createAssociateManagerMapping(token, formData);
        toast.success('Mapping created successfully');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      toast.error(message);
    }
  };

  const handleDeactivate = async (mapping: AssociateManagerMapping) => {
    if (!token) return;
    try {
      await evaluationReportService.deactivateAssociateManagerMapping(token, mapping._id!);
      toast.success('Mapping deactivated');
      loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deactivate';
      toast.error(message);
    }
  };

  const handleSelectAssociate = (employeeNumber: string) => {
    const associate = associates.find((a) => a.employeeNumber === employeeNumber);
    if (associate) {
      setFormData({
        ...formData,
        associateEmployeeNumber: associate.employeeNumber,
        associateName: associate.employeeName,
      });
    }
  };

  const handleSelectManager = (managerId: string) => {
    const manager = managers.find((m) => m.managerId === managerId);
    if (manager) {
      setFormData({
        ...formData,
        managerEmployeeNumber: manager.managerId,
        managerName: manager.managerName,
      });
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading mappings..." />;
  if (error) return <ServiceError message={error} onRetry={loadData} />;

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
        <PageHeader title="Associate-Manager Mappings" subtitle="Manage associate to manager mappings" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="button" variant="outline" onClick={loadData}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>refresh</span>
            Refresh
          </Button>
          <Button type="button" variant="primary" onClick={handleOpenCreateModal}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
            Add Mapping
          </Button>
        </div>
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Associate</th>
                <th>Manager</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mappings.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '28px' }}>
                    No mappings found.
                  </td>
                </tr>
              ) : (
                mappings.map((mapping) => (
                  <tr key={mapping._id}>
                    <td>{mapping.associateName} ({mapping.associateEmployeeNumber})</td>
                    <td>{mapping.managerName} ({mapping.managerEmployeeNumber})</td>
                    <td>
                      <Badge variant={mapping.isActive ? 'success' : 'warning'}>
                        {mapping.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Button type="button" variant="outline" onClick={() => handleOpenEditModal(mapping)}>
                          Edit
                        </Button>
                        {mapping.isActive && (
                          <Button
                            type="button"
                            variant="outline"
                            style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                            onClick={() => handleDeactivate(mapping)}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
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
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{editingMapping ? 'Edit Mapping' : 'Add Mapping'}</h3>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                ✕
              </Button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="associate" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  Associate
                </label>
                <select
                  id="associate"
                  value={formData.associateEmployeeNumber}
                  onChange={(e) => handleSelectAssociate(e.target.value)}
                  disabled={!!editingMapping}
                  required
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                  }}
                >
                  <option value="">Select Associate</option>
                  {associates.map((associate) => (
                    <option key={associate.employeeNumber} value={associate.employeeNumber}>
                      {associate.employeeName} ({associate.employeeNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="manager" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  Manager
                </label>
                <select
                  id="manager"
                  value={formData.managerEmployeeNumber}
                  onChange={(e) => handleSelectManager(e.target.value)}
                  required
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                  }}
                >
                  <option value="">Select Manager</option>
                  {managers.map((manager) => (
                    <option key={manager.managerId} value={manager.managerId}>
                      {manager.managerName} ({manager.managerId})
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  {editingMapping ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

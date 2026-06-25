import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PageHeader } from '../../components/PageHeader';
import { ServiceError } from '../../components/ServiceError';
import { useAuth } from '../../contexts/AuthContext';
import { probationService } from '../../services/probation.service';
import type { Employee } from '../../types';

export function HrAssociatesPage() {
  const { token } = useAuth();
  const [associates, setAssociates] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editingAssociate, setEditingAssociate] = useState<Employee | null>(null);
  const [deletingAssociate, setDeletingAssociate] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    employeeNumber: '',
    employeeName: '',
    dateOfJoining: '',
    totalHours: 0,
    department: '',
    projectName: '',
    managerId: '',
  });

  const loadAssociates = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await probationService.getEmployees(token);
      setAssociates(data.employees);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load associates');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleOpenCreateModal = () => {
    setEditingAssociate(null);
    setFormData({
      employeeNumber: '',
      employeeName: '',
      dateOfJoining: '',
      totalHours: 0,
      department: '',
      projectName: '',
      managerId: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (associate: Employee) => {
    setEditingAssociate(associate);
    setFormData({
      employeeNumber: associate.employeeNumber,
      employeeName: associate.employeeName,
      dateOfJoining: associate.dateOfJoining,
      totalHours: associate.totalHours,
      department: associate.department,
      projectName: associate.projectName,
      managerId: associate.managerId,
    });
    setIsModalOpen(true);
  };

  const handleOpenDeleteConfirm = (associate: Employee) => {
    setDeletingAssociate(associate);
    setIsDeleteConfirmOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      if (editingAssociate) {
        await probationService.updateEmployee(token, editingAssociate.employeeNumber, formData);
        toast.success('Associate updated successfully');
      } else {
        await probationService.createEmployee(token, formData);
        toast.success('Associate created successfully');
      }
      setIsModalOpen(false);
      loadAssociates();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!token || !deletingAssociate) return;

    try {
      await probationService.deleteEmployee(token, deletingAssociate.employeeNumber);
      toast.success('Associate deleted successfully');
      setIsDeleteConfirmOpen(false);
      setDeletingAssociate(null);
      loadAssociates();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      toast.error(message);
    }
  };

  const filteredAssociates = associates.filter((associate) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      associate.employeeName.toLowerCase().includes(query) ||
      associate.employeeNumber.toLowerCase().includes(query) ||
      associate.department.toLowerCase().includes(query) ||
      associate.projectName.toLowerCase().includes(query)
    );
  });

  if (isLoading) return <LoadingSpinner message="Loading associates..." />;
  if (error) return <ServiceError message={error} onRetry={loadAssociates} />;

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
        <PageHeader title="Associates" subtitle="Manage associate accounts and details" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="button" variant="outline" onClick={loadAssociates}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>refresh</span>
            Refresh
          </Button>
          <Button type="button" variant="primary" onClick={handleOpenCreateModal}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
            Add Associate
          </Button>
        </div>
      </div>

      <Card>
        <div style={{ marginBottom: '16px', position: 'relative', maxWidth: '320px' }}>
          <span
            className="material-symbols-outlined"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', color: 'var(--text-muted)' }}
          >
            search
          </span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search associates..."
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Employee Number</th>
                <th>Name</th>
                <th>Date of Joining</th>
                <th>Department</th>
                <th>Project</th>
                <th>Manager ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssociates.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '28px' }}>
                    No associates found.
                  </td>
                </tr>
              ) : (
                filteredAssociates.map((associate) => (
                  <tr key={associate.employeeNumber}>
                    <td>{associate.employeeNumber}</td>
                    <td>{associate.employeeName}</td>
                    <td>{associate.dateOfJoining}</td>
                    <td>{associate.department}</td>
                    <td>{associate.projectName}</td>
                    <td>{associate.managerId}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <Button type="button" variant="outline" onClick={() => handleOpenEditModal(associate)}>
                          Edit
                        </Button>
                        <Button type="button" variant="outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleOpenDeleteConfirm(associate)}>
                          Delete
                        </Button>
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
              <h3 style={{ margin: 0 }}>{editingAssociate ? 'Edit Associate' : 'Add Associate'}</h3>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                ✕
              </Button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="employeeNumber" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Employee Number *</label>
                <input
                  id="employeeNumber"
                  type="text"
                  value={formData.employeeNumber}
                  onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                  disabled={!!editingAssociate}
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
                <label htmlFor="employeeName" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Name *</label>
                <input
                  id="employeeName"
                  type="text"
                  value={formData.employeeName}
                  onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
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
                <label htmlFor="dateOfJoining" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Date of Joining *</label>
                <input
                  id="dateOfJoining"
                  type="date"
                  value={formData.dateOfJoining}
                  onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
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
                <label htmlFor="totalHours" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Total Hours *</label>
                <input
                  id="totalHours"
                  type="number"
                  value={formData.totalHours}
                  onChange={(e) => setFormData({ ...formData, totalHours: Number(e.target.value) })}
                  required
                  min={0}
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
                <label htmlFor="department" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Department *</label>
                <input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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
                <label htmlFor="projectName" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Project *</label>
                <input
                  id="projectName"
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
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
                <label htmlFor="managerId" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Manager ID *</label>
                <input
                  id="managerId"
                  type="text"
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
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
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">{editingAssociate ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Confirm Delete</h3>
              <Button type="button" variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
                ✕
              </Button>
            </div>
            <p style={{ marginBottom: '24px' }}>
              Are you sure you want to delete associate <strong>{deletingAssociate?.employeeName}</strong> ({deletingAssociate?.employeeNumber})?
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button type="button" variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
              <Button type="button" variant="primary" style={{ background: 'var(--danger)' }} onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { PageHeader } from '../../components/PageHeader';
import { ServiceError } from '../../components/ServiceError';
import { useAuth } from '../../contexts/AuthContext';
import { probationService } from '../../services/probation.service';
import type { Manager } from '../../types';

export function HrManagersPage() {
  const { token } = useAuth();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [formData, setFormData] = useState({
    managerId: '',
    managerName: '',
    email: '',
    password: '',
    department: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const loadManagers = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await probationService.getManagers(token);
      setManagers(data.managers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load managers');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleOpenCreateModal = () => {
    setEditingManager(null);
    setFormData({
      managerId: '',
      managerName: '',
      email: '',
      password: '',
      department: '',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (manager: Manager) => {
    setEditingManager(manager);
    setFormData({
      managerId: manager.managerId,
      managerName: manager.managerName,
      email: manager.email,
      password: '',
      department: manager.department,
      status: manager.status,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      if (editingManager) {
        await probationService.updateManager(token, editingManager.managerId, {
          managerName: formData.managerName,
          email: formData.email,
          department: formData.department,
          status: formData.status,
          ...(formData.password ? { password: formData.password } : {}),
        });
        toast.success('Manager updated successfully');
      } else {
        await probationService.createManager(token, formData);
        toast.success('Manager created successfully');
      }
      setIsModalOpen(false);
      loadManagers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Operation failed';
      toast.error(message);
    }
  };

  const filteredManagers = managers.filter((manager) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      manager.managerName.toLowerCase().includes(query) ||
      manager.managerId.toLowerCase().includes(query) ||
      manager.email.toLowerCase().includes(query) ||
      manager.department.toLowerCase().includes(query)
    );
  });

  if (isLoading) return <LoadingSpinner message="Loading managers..." />;
  if (error) return <ServiceError message={error} onRetry={loadManagers} />;

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
        <PageHeader title="Managers" subtitle="Manage manager accounts and details" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button type="button" variant="outline" onClick={loadManagers}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>refresh</span>
            Refresh
          </Button>
          <Button type="button" variant="primary" onClick={handleOpenCreateModal}>
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
            Add Manager
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
            placeholder="Search managers..."
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
                <th>Manager ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredManagers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '28px' }}>
                    No managers found.
                  </td>
                </tr>
              ) : (
                filteredManagers.map((manager) => (
                  <tr key={manager.managerId}>
                    <td>{manager.managerId}</td>
                    <td>{manager.managerName}</td>
                    <td>{manager.email}</td>
                    <td>{manager.department}</td>
                    <td>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '16px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          background: manager.status === 'Active' ? 'var(--success-light)' : 'var(--danger-light)',
                          color: manager.status === 'Active' ? 'var(--success)' : 'var(--danger)',
                        }}
                      >
                        {manager.status}
                      </span>
                    </td>
                    <td>
                      <Button type="button" variant="outline" onClick={() => handleOpenEditModal(manager)}>
                        Edit
                      </Button>
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
              <h3 style={{ margin: 0 }}>{editingManager ? 'Edit Manager' : 'Add Manager'}</h3>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                ✕
              </Button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="managerId" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Manager ID *</label>
                <input
                  id="managerId"
                  type="text"
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  disabled={!!editingManager}
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
                <label htmlFor="managerName" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Name *</label>
                <input
                  id="managerName"
                  type="text"
                  value={formData.managerName}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
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
                <label htmlFor="email" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Email *</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                <label htmlFor="password" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {editingManager ? 'New Password (leave blank to keep current)' : 'Password *'}
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingManager}
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
                <label htmlFor="status" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Status</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                  }}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">{editingManager ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

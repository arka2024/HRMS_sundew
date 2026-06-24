import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { employeeService, type EmployeeUploadHistoryItem, type SyncedEmployee } from '../../services/employee.service';
import { onEmployeeSync } from '../../utils/employeeSyncEvents';

export function HrEmployeeSyncPanel() {
  const { token } = useAuth();
  const [employees, setEmployees] = useState<SyncedEmployee[]>([]);
  const [history, setHistory] = useState<EmployeeUploadHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSyncData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [employeeData, historyData] = await Promise.all([
        employeeService.getHrEmployees(token),
        employeeService.getUploadHistory(token),
      ]);
      setEmployees(employeeData.employees);
      setHistory(historyData.history);
    } catch {
      // Panel is supplementary — fail silently
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSyncData();
    return onEmployeeSync(() => loadSyncData());
  }, [loadSyncData]);

  const latestUpload = history[0];
  const departments = new Set(employees.map((employee) => employee.department)).size;

  return (
    <motion.div
      className="elevate-panel elevate-employee-sync-panel"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="panel-header" style={{ marginBottom: '12px' }}>
        <h3>Employee Sync</h3>
        <Link to={ROUTES.HR.EMPLOYEE_UPLOAD} className="elevate-audit-link" style={{ fontSize: '0.78rem' }}>
          Upload
        </Link>
      </div>

      <div className="employee-sync-stats">
        <div className="employee-sync-stat">
          <strong>{isLoading ? '—' : employees.length}</strong>
          <span>Synced employees</span>
        </div>
        <div className="employee-sync-stat">
          <strong>{isLoading ? '—' : departments}</strong>
          <span>Departments</span>
        </div>
        <div className="employee-sync-stat">
          <strong>{isLoading ? '—' : history.length}</strong>
          <span>Uploads</span>
        </div>
      </div>

      <p className="employee-sync-note">
        All records assign to <strong>Demo Manager (MGR001)</strong> and appear in the Manager Portal automatically.
      </p>

      {latestUpload && (
        <div className="employee-sync-latest">
          <span className="material-symbols-outlined">sync</span>
          <div>
            <strong>{latestUpload.fileName}</strong>
            <span>
              {latestUpload.successCount} imported · {new Date(latestUpload.uploadedAt).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {employees.length > 0 && (
        <div className="employee-sync-preview">
          {employees.slice(0, 3).map((employee) => (
            <div key={employee.employeeNumber} className="employee-sync-preview-row">
              <span>{employee.employeeName}</span>
              <small>{employee.projectName}</small>
            </div>
          ))}
          {employees.length > 3 && (
            <Link to={ROUTES.HR.EMPLOYEES} className="elevate-audit-link">
              View all {employees.length} employees
            </Link>
          )}
        </div>
      )}
    </motion.div>
  );
}

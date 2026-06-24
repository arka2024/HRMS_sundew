import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import { HrUploadScene } from '../../components/hr/HrUploadScene';
import { useAuth } from '../../contexts/AuthContext';
import { ApiClientError } from '../../services/api.client';
import {
  employeeService,
  type EmployeePreviewResponse,
  type EmployeeUploadHistoryItem,
  type EmployeeUploadResponse,
} from '../../services/employee.service';
import { notifyEmployeeSync } from '../../utils/employeeSyncEvents';

const SUPPORTED_EXTENSIONS = /\.(csv|xlsx|xls|pdf)$/i;

function isSupportedFile(file: File) {
  return SUPPORTED_EXTENSIONS.test(file.name);
}

export function HrEmployeeUploadPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<EmployeePreviewResponse | null>(null);
  const [uploadResult, setUploadResult] = useState<EmployeeUploadResponse | null>(null);
  const [history, setHistory] = useState<EmployeeUploadHistoryItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleExpiredToken(error: unknown) {
    if (error instanceof ApiClientError && error.status === 401) {
      await logout();
      toast.error('Session expired. Please sign in again.');
      navigate('/login', { replace: true });
      return true;
    }
    return false;
  }

  const loadHistory = useCallback(async () => {
    if (!token) return;
    try {
      const data = await employeeService.getUploadHistory(token);
      setHistory(data.history);
    } catch (loadError) {
      if (await handleExpiredToken(loadError)) return;
      // History is optional on first load
    }
  }, [token, handleExpiredToken]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function processFile(selectedFile: File) {
    if (!token) return;
    setError(null);
    setUploadResult(null);
    setShowConfirm(false);
    setFile(selectedFile);

    if (!isSupportedFile(selectedFile)) {
      setError('Only CSV, XLSX, and PDF files are supported.');
      setPreview(null);
      return;
    }

    setIsPreviewing(true);
    setUploadProgress(15);
    try {
      const result = await employeeService.previewUpload(token, selectedFile);
      setPreview(result);
      setUploadProgress(100);
      if (result.preview.length > 0) {
        setShowConfirm(true);
        toast.success(`Parsed ${result.preview.length} valid employee records.`);
      } else {
        toast.error('No valid employee records found in the file.');
      }
    } catch (previewError) {
      if (await handleExpiredToken(previewError)) return;
      const message = previewError instanceof Error ? previewError.message : 'Failed to parse file.';
      setError(message);
      setPreview(null);
      toast.error(message);
    } finally {
      setIsPreviewing(false);
      setUploadProgress(0);
    }
  }

  async function handleConfirmImport() {
    if (!token || !file) return;
    setError(null);
    setIsUploading(true);
    setUploadProgress(10);

    const progressInterval = window.setInterval(() => {
      setUploadProgress((current) => Math.min(current + 8, 90));
    }, 200);

    try {
      const result = await employeeService.uploadEmployees(token, file);
      setUploadProgress(100);
      setUploadResult(result);
      setShowConfirm(false);
      await loadHistory();
      notifyEmployeeSync({ successCount: result.successCount, failedCount: result.failedCount });
      toast.success(`Imported ${result.successCount} employees — synced to Manager Portal.`);
    } catch (uploadError) {
      if (await handleExpiredToken(uploadError)) return;
      const message = uploadError instanceof Error ? uploadError.message : 'Employee upload failed.';
      setError(message);
      toast.error(message);
    } finally {
      window.clearInterval(progressInterval);
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 600);
    }
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragOver(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) processFile(droppedFile);
  }

  return (
    <div className="hr-upload-page">
      <div className="hr-upload-scene-wrap">
        <HrUploadScene isUploading={isPreviewing || isUploading} uploadProgress={uploadProgress} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          title="Employee Data Upload"
          subtitle="Import employee records from CSV, XLSX, or PDF — automatically synced to the Manager Portal"
        />

        <Card style={{ marginBottom: '20px', position: 'relative', zIndex: 1 }}>
          <div
            className="file-upload-zone"
            style={{
              border: isDragOver ? '2px dashed var(--primary)' : '2px dashed var(--border)',
              background: isDragOver ? 'var(--primary-light)' : 'rgba(255,255,255,0.85)',
              opacity: isPreviewing || isUploading ? 0.7 : 1,
              pointerEvents: isPreviewing || isUploading ? 'none' : 'auto',
            }}
            onClick={() => document.getElementById('employee-upload-input')?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                document.getElementById('employee-upload-input')?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragOver(false);
            }}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
          >
            <input
              id="employee-upload-input"
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              style={{ display: 'none' }}
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) processFile(selected);
              }}
            />
            <span
              className="material-symbols-outlined file-upload-icon"
              style={{ animation: isPreviewing || isUploading ? 'spin 1s linear infinite' : undefined }}
            >
              {isPreviewing || isUploading ? 'sync' : 'cloud_upload'}
            </span>
            <h3 className="file-upload-title">
              {isPreviewing
                ? 'Extracting employee data...'
                : isUploading
                  ? 'Importing & syncing...'
                  : file
                    ? file.name
                    : 'Drop employee file here, or click to browse'}
            </h3>
            <p className="file-upload-subtitle">
              Supported: CSV, XLSX, PDF — Employee Number, Name, DOJ, Hours, Department, Project
            </p>

            {(isPreviewing || isUploading) && (
              <div style={{ marginTop: '16px', width: '100%', maxWidth: '360px' }}>
                <div className="progress-bar-wrap">
                  <motion.div
                    className="progress-bar"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ ease: 'easeOut' }}
                  />
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                  {uploadProgress}% complete
                </span>
              </div>
            )}
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 700, marginTop: '12px' }}>
              {error}
            </div>
          )}
        </Card>

        <AnimatePresence>
          {preview && showConfirm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card style={{ marginBottom: '20px' }}>
                <div className="panel-header">
                  <h3>Preview Extracted Data</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {preview.summary.valid} valid / {preview.summary.failed} failed
                  </span>
                </div>

                <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Employee #</th>
                        <th>Name</th>
                        <th>DOJ</th>
                        <th>Hours</th>
                        <th>Department</th>
                        <th>Project</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.preview.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                            No valid records to import
                          </td>
                        </tr>
                      ) : (
                        preview.preview.map((record) => (
                          <tr key={record.employeeNumber}>
                            <td>{record.employeeNumber}</td>
                            <td>{record.employeeName}</td>
                            <td>{record.dateOfJoining}</td>
                            <td>{record.totalHoursWorked}</td>
                            <td>{record.department}</td>
                            <td>{record.projectName}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {preview.failedRecords.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '0.85rem', marginBottom: '8px' }}>Failed Records</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table>
                        <thead>
                          <tr>
                            <th>Row</th>
                            <th>Employee #</th>
                            <th>Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.failedRecords.map((record) => (
                            <tr key={`${record.row}-${record.employeeNumber || 'unknown'}`}>
                              <td>{record.row}</td>
                              <td>{record.employeeNumber || '-'}</td>
                              <td>{record.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Button
                    type="button"
                    variant="primary"
                    onClick={handleConfirmImport}
                    disabled={isUploading || preview.preview.length === 0}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>check_circle</span>
                    {isUploading ? 'Importing...' : 'Confirm Import'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowConfirm(false)}>
                    Cancel
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {uploadResult && (
          <Card style={{ marginBottom: '20px' }}>
            <div className="panel-header">
              <h3>Upload Summary</h3>
            </div>
            <div className="stat-grid" style={{ marginBottom: '16px' }}>
              <div className="stat-card">
                <strong>{uploadResult.successCount}</strong>
                <span>Imported</span>
              </div>
              <div className="stat-card">
                <strong>{uploadResult.failedCount}</strong>
                <span>Failed</span>
              </div>
              <div className="stat-card">
                <strong>Demo Manager</strong>
                <span>Assigned to all</span>
              </div>
            </div>
            {uploadResult.errors.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Employee #</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResult.errors.map((record) => (
                      <tr key={`${record.row}-${record.employeeNumber || 'unknown'}`}>
                        <td>{record.row}</td>
                        <td>{record.employeeNumber || '-'}</td>
                        <td>{record.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        <Card>
          <div className="panel-header">
            <h3>Upload History</h3>
            <Button type="button" variant="outline" onClick={loadHistory}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>refresh</span>
              Refresh
            </Button>
          </div>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No uploads yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                    <th>Success</th>
                    <th>Failed</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>{item.fileName}</td>
                      <td>{item.uploadedBy}</td>
                      <td>{new Date(item.uploadedAt).toLocaleString()}</td>
                      <td>{item.successCount}</td>
                      <td>{item.failedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

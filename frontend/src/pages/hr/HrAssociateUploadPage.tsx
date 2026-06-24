import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { PageHeader } from '../../components/PageHeader';
import { useAuth } from '../../contexts/AuthContext';
import { associateService } from '../../services/associate.service';
import type { AssociateTaskSyncResponse, AssociateUploadResponse } from '../../types';

function isSupportedFile(file: File) {
  return /\.(csv|xlsx)$/i.test(file.name);
}

export function HrAssociateUploadPage() {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<AssociateUploadResponse | null>(null);
  const [syncResult, setSyncResult] = useState<AssociateTaskSyncResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  async function processUpload(selectedFile: File) {
    if (!token) return;
    setError(null);
    setSyncResult(null);
    setFile(selectedFile);

    if (!isSupportedFile(selectedFile)) {
      setError('Only .csv and .xlsx files are supported.');
      return;
    }

    setIsUploading(true);
    try {
      const result = await associateService.uploadAssociates(token, selectedFile);
      setUploadResult(result);
      toast.success(`Imported ${result.summary.successful} associate records.`);
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : 'Associate upload failed.';
      setError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    if (file) {
      processUpload(file);
    }
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragOver(false);
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      processUpload(droppedFile);
    }
  }

  async function handleSyncTasks() {
    if (!token) return;
    setError(null);
    setIsSyncing(true);

    try {
      const result = await associateService.syncTasks(token);
      setSyncResult(result);
      toast.success(`Synced task counts for ${result.summary.updated} associates.`);
    } catch (syncError) {
      const message = syncError instanceof Error ? syncError.message : 'Task sync failed.';
      setError(message);
      toast.error(message);
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Associate Upload"
        subtitle="Import probation associate data and prepare it for manager review"
      />

      <Card style={{ marginBottom: '20px' }}>
        <form onSubmit={handleUpload} style={{ display: 'grid', gap: '18px' }}>
          <div
            className="file-upload-zone"
            style={{ 
              border: isDragOver ? '2px dashed var(--primary)' : '2px dashed var(--border)',
              background: isDragOver ? 'var(--primary-light)' : 'transparent',
              opacity: isUploading ? 0.6 : 1,
              pointerEvents: isUploading ? 'none' : 'auto'
            }}
            onClick={() => document.getElementById('associate-upload-input')?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                document.getElementById('associate-upload-input')?.click();
              }
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
          >
            <input
              id="associate-upload-input"
              type="file"
              accept=".csv,.xlsx"
              style={{ display: 'none' }}
              onChange={(event) => {
                const selected = event.target.files?.[0];
                if (selected) processUpload(selected);
              }}
            />
            <span className="material-symbols-outlined file-upload-icon">
              {isUploading ? 'sync' : 'cloud_upload'}
            </span>
            <h3 className="file-upload-title">
              {isUploading ? 'Uploading...' : file ? file.name : 'Drop associate CSV or XLSX here, or click to browse'}
            </h3>
            <p className="file-upload-subtitle">
              Required columns: Employee ID, Employee Name, Designation, Date of Joining, Probation Duration Months
            </p>
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 700 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button type="button" variant="primary" onClick={handleSyncTasks} disabled={isSyncing || isUploading}>
              <span className="material-symbols-outlined" style={{ fontSize: '1.05rem' }}>sync</span>
              {isSyncing ? 'Syncing...' : 'Sync Task Counts'}
            </Button>
          </div>
        </form>
      </Card>

      {uploadResult && (
        <Card style={{ marginBottom: '20px' }}>
          <div className="panel-header">
            <h3>Import Summary</h3>
          </div>
          <div className="stat-grid" style={{ marginBottom: '20px' }}>
            <div className="stat-card"><strong>{uploadResult.summary.total}</strong><span>Total rows</span></div>
            <div className="stat-card"><strong>{uploadResult.summary.successful}</strong><span>Successful</span></div>
            <div className="stat-card"><strong>{uploadResult.summary.failed}</strong><span>Failed</span></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem' }}>Successful Records</h4>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Employee ID</th>
                      <th>Name</th>
                      <th>Designation</th>
                      <th>Probation End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResult.successfulRecords.map((record) => (
                      <tr key={record.employeeId}>
                        <td>{record.employeeId}</td>
                        <td>{record.name}</td>
                        <td>{record.designation || '-'}</td>
                        <td>{record.probationEndDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem' }}>Failed Records</h4>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Employee ID</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResult.failedRecords.length === 0 ? (
                      <tr><td colSpan={3}>No failed records</td></tr>
                    ) : (
                      uploadResult.failedRecords.map((record) => (
                        <tr key={`${record.row}-${record.employeeId || 'unknown'}`}>
                          <td>{record.row}</td>
                          <td>{record.employeeId || '-'}</td>
                          <td>{record.reason}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>
      )}

      {syncResult && (
        <Card>
          <div className="panel-header">
            <h3>Task Sync Summary</h3>
          </div>
          <div className="stat-grid" style={{ marginBottom: '16px' }}>
            <div className="stat-card"><strong>{syncResult.summary.total}</strong><span>Total associates</span></div>
            <div className="stat-card"><strong>{syncResult.summary.updated}</strong><span>Updated</span></div>
            <div className="stat-card"><strong>{syncResult.summary.failed}</strong><span>Failed</span></div>
          </div>
          {syncResult.failedRecords.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {syncResult.failedRecords.map((record) => (
                    <tr key={record.employeeId}>
                      <td>{record.employeeId}</td>
                      <td>{record.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

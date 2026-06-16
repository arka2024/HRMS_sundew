import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Table } from '../../components/Table';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { ServiceError } from '../../components/ServiceError';
import { useAuth } from '../../contexts/AuthContext';
import { hrService, type HrDocument, type HrActivity, type HrStorageStats } from '../../services/hr.service';

const ACCEPTED_FILE_TYPES = [
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.csv',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
  '.zip',
].join(',');

export function HrDashboardPage() {
  const { token } = useAuth();

  const [documents, setDocuments] = useState<HrDocument[]>([]);
  const [activities, setActivities] = useState<HrActivity[]>([]);
  const [storage, setStorage] = useState<HrStorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  function loadDashboardData() {
    setIsLoading(true);
    setError(null);

    Promise.all([
      hrService.getDocuments(token!),
      hrService.getActivity(token!),
      hrService.getStorage(token!),
    ])
      .then(([docsData, activityData, storageData]) => {
        setDocuments(docsData.documents);
        setActivities(activityData.activities);
        setStorage(storageData.storage);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load HR dashboard data:', err);
        setError('Failed to connect to HR Service backend.');
        setIsLoading(false);
      });
  }

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Drag and drop handlers
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  // Drag and drop handlers
  function handleDragLeave() {
    setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await uploadFiles(files);
    }
    e.target.value = '';
  }

  async function uploadFiles(files: File[]) {
    setIsUploading(true);
    const toastId = toast.loading(`Uploading ${files.length} file${files.length === 1 ? '' : 's'}...`);

    try {
      await Promise.all(files.map((file) => hrService.uploadDocument(token!, file.name)));
      toast.success(`${files.length} file${files.length === 1 ? '' : 's'} uploaded successfully!`, { id: toastId });
      loadDashboardData(); // Refresh stats and list
    } catch {
      toast.error('Failed to upload one or more documents.', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  }

  function handleDownload(docName: string) {
    toast.success(`Downloading ${docName}...`);
  }

  function handleDownloadAll() {
    toast.success('Archiving and downloading all documents...');
  }

  function handleExportFiles() {
    toast.success('Exporting file index and history...');
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading Document Workspace..." />;
  }

  if (error) {
    return <ServiceError message={error} onRetry={loadDashboardData} />;
  }

  return (
    <div className="hr-grid">
      {/* Left Column: Doc upload and list */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Document Management</h2>
            <p style={{ color: 'var(--text-muted)', margin: '4px 0 0', fontSize: '0.9rem' }}>
              Manage organization policies, contracts, and employee handbooks.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button type="button" variant="outline" onClick={handleDownloadAll}>
              Download All
            </Button>
            <Button type="button" variant="outline" onClick={handleExportFiles}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>download</span>
              Export Files
            </Button>
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>upload</span>
              Upload Files
              <input type="file" multiple accept={ACCEPTED_FILE_TYPES} onChange={handleFileSelect} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        <Card style={{ padding: '24px', marginBottom: '24px' }}>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`file-upload-zone ${isDragging ? 'drag-over' : ''}`}
            onClick={() => {
              const fileInput = document.getElementById('click-file-upload');
              if (fileInput) fileInput.click();
            }}
          >
            <input
              type="file"
              id="click-file-upload"
              multiple
              accept={ACCEPTED_FILE_TYPES}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            {isUploading ? (
              <div className="spinner" style={{ width: '36px', height: '36px' }}></div>
            ) : (
              <span className="material-symbols-outlined file-upload-icon">cloud_upload</span>
            )}
            <h3 className="file-upload-title">Drop files here to upload</h3>
            <p className="file-upload-subtitle">
              or <span style={{ color: 'var(--primary)', fontWeight: 600 }}>browse your computer</span> (Max 50MB per file)
            </p>
            <div className="file-type-chips" aria-label="Accepted file types">
              {['PDF', 'DOCX', 'XLSX', 'PPT', 'CSV', 'Images', 'ZIP'].map((type) => (
                <span key={type}>{type}</span>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="panel-header">
            <h3>Recent Documents</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="top-navbar-btn" style={{ width: '32px', height: '32px' }}>
                <span className="material-symbols-outlined">view_list</span>
              </button>
              <button type="button" className="top-navbar-btn" style={{ width: '32px', height: '32px' }}>
                <span className="material-symbols-outlined">view_comfy</span>
              </button>
            </div>
          </div>

          <Table<HrDocument>
            data={documents}
            keyExtractor={(doc) => doc.id}
            onRowClick={(doc) => handleDownload(doc.name)}
            columns={[
              {
                header: 'Name',
                accessor: (doc) => {
                  let fileIcon = 'draft';
                  let iconColor = 'var(--text-muted)';
                  
                  if (doc.type.includes('PDF')) {
                    fileIcon = 'picture_as_pdf';
                    iconColor = '#ef4444';
                  } else if (doc.type.includes('Word')) {
                    fileIcon = 'description';
                    iconColor = '#3b82f6';
                  } else if (doc.type.includes('Excel')) {
                    fileIcon = 'table_chart';
                    iconColor = '#10b981';
                  } else if (doc.type.includes('Image') || doc.type.includes('Media')) {
                    fileIcon = 'image';
                    iconColor = '#8b5cf6';
                  } else if (doc.type.includes('CSV')) {
                    fileIcon = 'csv';
                    iconColor = '#14b8a6';
                  } else if (doc.type.includes('Zip')) {
                    fileIcon = 'folder_zip';
                    iconColor = '#f59e0b';
                  }

                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="material-symbols-outlined" style={{ color: iconColor }}>{fileIcon}</span>
                      <strong style={{ fontWeight: 600, color: 'var(--text)' }}>{doc.name}</strong>
                    </div>
                  );
                }
              },
              {
                header: 'Type',
                accessor: (doc) => <span style={{ color: 'var(--text-muted)' }}>{doc.type}</span>
              },
              {
                header: 'Date Added',
                accessor: (doc) => <span style={{ color: 'var(--text-muted)' }}>{doc.dateAdded}</span>
              },
              {
                header: 'Owner',
                accessor: (doc) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {doc.avatar ? (
                      <img src={doc.avatar} alt={doc.owner} style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                    ) : (
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary)', color: 'white', fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {doc.owner.charAt(0)}
                      </div>
                    )}
                    <span style={{ fontSize: '0.85rem' }}>{doc.owner}</span>
                  </div>
                )
              }
            ]}
          />
        </Card>
      </div>

      {/* Right Column: stats, activity feed, promo */}
      <div>
        {storage && (
          <Card>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Storage Statistics</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Used</span>
                <span>{storage.used.toFixed(1)} GB / {storage.limit} GB</span>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar" style={{ width: `${(storage.used / storage.limit) * 100}%` }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <Card style={{ flex: 1, padding: '12px', marginBottom: 0, background: 'var(--bg)' }}>
                <span className="slider-label" style={{ fontSize: '0.65rem' }}>Documents</span>
                <strong style={{ display: 'block', fontSize: '1.2rem', marginTop: '4px' }}>{storage.documentsCount}</strong>
              </Card>
              <Card style={{ flex: 1, padding: '12px', marginBottom: 0, background: 'var(--bg)' }}>
                <span className="slider-label" style={{ fontSize: '0.65rem' }}>Media</span>
                <strong style={{ display: 'block', fontSize: '1.2rem', marginTop: '4px' }}>{storage.mediaCount}</strong>
              </Card>
            </div>

            <div className="storage-stats-categories">
              <div className="storage-category-item">
                <div className="storage-category-label">
                  <span className="storage-category-dot" style={{ background: 'var(--primary)' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>Legal & Contracts</span>
                </div>
                <span className="storage-category-val">{storage.legal.toFixed(1)} GB</span>
              </div>
              <div className="storage-category-item">
                <div className="storage-category-label">
                  <span className="storage-category-dot" style={{ background: 'var(--secondary)' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>Internal Policies</span>
                </div>
                <span className="storage-category-val">{storage.policies.toFixed(1)} GB</span>
              </div>
              <div className="storage-category-item">
                <div className="storage-category-label">
                  <span className="storage-category-dot" style={{ background: 'var(--success)' }}></span>
                  <span style={{ color: 'var(--text-muted)' }}>Employee Records</span>
                </div>
                <span className="storage-category-val">{storage.records.toFixed(1)} GB</span>
              </div>
            </div>
          </Card>
        )}

        <Card style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px' }}>File History</h3>
          
          <div className="activity-stream">
            {activities.map((act) => (
              <div key={act.id} className="activity-item">
                <div className="activity-icon">
                  <span className="material-symbols-outlined" style={{ fontSize: '0.95rem' }}>
                    {act.action === 'uploaded' ? 'upload_file' : act.action.includes('deleted') ? 'delete' : 'download'}
                  </span>
                </div>
                <div className="activity-content">
                  <p style={{ margin: 0 }}>
                    <strong>{act.user}</strong> {act.action} <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{act.target}</span>
                  </p>
                  <div className="activity-time">{act.time}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => toast.success('Displaying full audit trails...')}
            style={{ width: '100%', marginTop: '24px', border: 'none', background: 'transparent', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
          >
            View Full History
          </button>
        </Card>

        <div className="document-footer-row">
          <div className="promo-banner promo-banner-compact">
            <h3>Secure E-Signatures</h3>
            <p>Send handbooks and contracts for digital approval.</p>
            <Button type="button" variant="outline" onClick={() => toast.success('Opening e-signature configuration...')} style={{ background: 'white', color: '#0f172a', alignSelf: 'flex-start', border: 'none', marginTop: '4px', padding: '6px 10px' }}>
              Configure
            </Button>
          </div>

          <div className="document-footer-card">
            <strong>Files</strong>
            <span>{documents.length} active</span>
            <button type="button" onClick={handleExportFiles}>
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

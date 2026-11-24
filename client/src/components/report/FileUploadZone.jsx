import React, { useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, X, FileCheck } from 'lucide-react';

export const FileUploadZone = ({
  fileInfo,
  onFileSelected,
  onClearFile,
  disabled = false
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read file metadata & simulate or encode data
    const reader = new FileReader();
    reader.onload = () => {
      onFileSelected({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onFileSelected({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        dataUrl: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.dcm"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={disabled}
      />

      {!fileInfo ? (
        <div
          className="file-dropzone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: '#eff6ff',
              color: 'var(--color-primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <UploadCloud size={28} />
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-slate-800)' }}>
              Click to select report file or drag & drop here
            </div>
            <div style={{ fontSize: '0.785rem', color: 'var(--color-slate-500)', marginTop: 2 }}>
              Supported formats: PDF, PNG, JPG, DICOM (Max 15 MB)
            </div>
          </div>
        </div>
      ) : (
        <div className="file-preview-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 'var(--radius-md)',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <FileCheck size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-slate-900)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {fileInfo.name}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-slate-500)' }}>
                {formatFileSize(fileInfo.size)} • {fileInfo.type}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="modal-close-btn"
            onClick={onClearFile}
            title="Remove attached file"
            disabled={disabled}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;

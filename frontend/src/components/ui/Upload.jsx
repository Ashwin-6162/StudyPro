import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { Button } from './Button';
import './UI.css';

export function FileUpload({ onFileSelect, accept = "*", disabled = false }) {
  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect?.(e.target.files);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        id="file-upload" 
        className="sr-only" 
        style={{ display: 'none' }}
        accept={accept}
        onChange={handleChange}
        disabled={disabled}
      />
      <label htmlFor="file-upload">
        <Button as="span" variant="outline" icon={UploadCloud} disabled={disabled} style={{ pointerEvents: 'none' }}>
          Choose File
        </Button>
      </label>
    </div>
  );
}

export function DragAndDropUpload({ onFileDrop, accept = "*", disabled = false }) {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileDrop?.(e.dataTransfer.files);
    }
  }, [disabled, onFileDrop]);

  return (
    <div 
      className={`upload-dropzone ${isDragActive ? 'active' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <UploadCloud size={48} className="upload-icon" />
      <p className="text-body-large" style={{ fontWeight: 'var(--font-weight-medium)' }}>
        Drag & Drop your files here
      </p>
      <p className="text-small" style={{ color: 'var(--color-text-muted)', marginTop: 'var(--spacing-8)' }}>
        Or click to browse from your computer
      </p>
      {/* Hidden file input for click-to-upload can be added here wrapping the container in a label */}
    </div>
  );
}

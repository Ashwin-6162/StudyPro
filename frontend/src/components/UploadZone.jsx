import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, AlertCircle } from 'lucide-react';
import api from '../services/api';

const UploadZone = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const onDrop = useCallback(async (acceptedFiles, fileRejections) => {
    setError(null);
    setUploadProgress(0);

    if (fileRejections.length > 0) {
      setError('Some files were rejected. Ensure they are PDF, PPTX, DOCX, or TXT and under 50MB.');
      return;
    }

    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      acceptedFiles.forEach(file => formData.append('files', file));

      await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
          }
        },
      });

      setUploadProgress(100);
      onUploadSuccess();
    } catch (err) {
      console.error("Upload error", err);
      setError(err.response?.data?.detail || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`p-4 rounded-full ${isDragActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
            <UploadCloud size={48} />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              {isDragActive ? "Drop the files here..." : "Drag & drop files here, or click to select"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Supported formats: PDF, PPTX, DOCX, TXT (Max 50MB)
            </p>
          </div>
        </div>
      </div>

      {isUploading && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center space-x-3 mb-2">
            <File className="text-blue-500 animate-bounce flex-shrink-0" size={24} />
            <span className="text-blue-700 dark:text-blue-300 font-medium">
              Uploading documents... {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center space-x-3 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default UploadZone;

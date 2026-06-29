import React, { useEffect, useState } from 'react';
import { Trash2, FileText, Loader2 } from 'lucide-react';
import api from '../services/api';
import { format } from 'date-fns';

const StatusBadge = ({ status }) => {
  const styles = {
    // Terminal states
    UPLOADED:               'bg-blue-100 text-blue-800 border-blue-200',
    FAILED:                 'bg-red-100 text-red-800 border-red-200',
    // Extraction
    EXTRACTING:             'bg-sky-100 text-sky-800 border-sky-200',
    EXTRACTED:              'bg-yellow-100 text-yellow-800 border-yellow-200',
    // Chunking
    CHUNKING:               'bg-orange-100 text-orange-800 border-orange-200',
    READY_FOR_EMBEDDING:    'bg-orange-100 text-orange-800 border-orange-200',
    // Embedding
    EMBEDDING_GENERATING:   'bg-purple-100 text-purple-800 border-purple-200',
    READY_FOR_INDEXING:     'bg-purple-100 text-purple-800 border-purple-200',
    // Indexing / ready
    INDEXING:               'bg-green-100 text-green-800 border-green-200',
    READY_FOR_RETRIEVAL:    'bg-green-100 text-green-800 border-green-200',
    // Legacy aliases kept for backwards compatibility
    CHUNKED:                'bg-orange-100 text-orange-800 border-orange-200',
    EMBEDDED:               'bg-purple-100 text-purple-800 border-purple-200',
    INDEXED:                'bg-green-100 text-green-800 border-green-200',
  };

  const defaultStyle = 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || defaultStyle}`}>
      {status}
    </span>
  );
};

const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const FileList = ({ refreshTrigger }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/files');
      setFiles(res.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch files", err);
      setError("Failed to load documents. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [refreshTrigger]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      await api.delete(`/files/${id}`);
      fetchFiles();
    } catch (err) {
      console.error("Failed to delete file", err);
      alert("Failed to delete the file.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
        <FileText className="mx-auto text-gray-300 mb-3" size={48} />
        <p className="text-gray-500 text-lg">No documents uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">File Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Size</th>
              <th className="px-6 py-4">Upload Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900 truncate max-w-[200px]" title={file.original_filename}>
                  {file.original_filename}
                </td>
                <td className="px-6 py-4 uppercase text-xs font-bold text-gray-500">
                  {file.file_type}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {formatBytes(file.file_size)}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {format(new Date(file.upload_timestamp), 'MMM dd, yyyy HH:mm')}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={file.processing_status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete File"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileList;

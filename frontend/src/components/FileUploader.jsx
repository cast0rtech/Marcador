import { useState } from 'react';
import { UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../i18n.jsx';

export default function FileUploader({ onUploadSuccess }) {
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus('idle');
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', file);

    const uploadUrl = (typeof window !== 'undefined' && (window.location.port === '3000' || window.location.port === '5173'))
      ? 'http://localhost:8000/api/points/import'
      : '/api/points/import';

    try {
      const response = await axios.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus('success');
      setMessage(response.data.message || t('importSuccess'));
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.detail || t('importError'));
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <UploadCloud className="text-blue-400" />
        {t('importConfig')}
      </h3>
      
      <div className="flex flex-col gap-4">
        <input 
          type="file" 
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
        />
        
        <button 
          onClick={handleUpload}
          disabled={!file || status === 'uploading'}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 transition-colors"
        >
          {status === 'uploading' ? t('uploading') : t('uploadBtn')}
        </button>

        <p className="text-xs text-gray-400 leading-relaxed font-mono">
          ℹ️ {t('fileInstructions')}
        </p>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-400 text-sm mt-2">
            <CheckCircle size={16} /> <span>{message}</span>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-400 text-sm mt-2">
            <AlertTriangle size={16} /> <span>{message}</span>
          </div>
        )}
      </div>
    </div>
  );
}

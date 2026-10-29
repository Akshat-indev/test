import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { resumeApi } from '../services/api.js';

const ACCEPTED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export default function ResumeUploader({ onSuccess, onError }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragging, setDragging] = useState(false);

  const validateFile = (f) => {
    if (!ACCEPTED_TYPES.includes(f.type) && !f.name.match(/\.(pdf|docx)$/i)) {
      return 'Only PDF and DOCX files are supported.';
    }
    if (f.size > MAX_SIZE) {
      return 'File size must be under 5 MB.';
    }
    return null;
  };

  const handleFile = useCallback((f) => {
    const err = validateFile(f);
    if (err) {
      setErrorMsg(err);
      setStatus('error');
      return;
    }
    setFile(f);
    setStatus('idle');
    setErrorMsg('');
    setResult(null);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, [handleFile]);

  const handleInputChange = (e) => {
    const selected = e.target.files[0];
    if (selected) handleFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    try {
      const data = await resumeApi.upload(file);
      setResult(data.resume);
      setStatus('success');
      onSuccess?.(data.resume);
    } catch (err) {
      setErrorMsg(err.message || 'Upload failed. Please try again.');
      setStatus('error');
      onError?.(err);
    }
  };

  const reset = () => {
    setFile(null);
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragging ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-brand-400 hover:bg-gray-50'
        }`}
      >
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleInputChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
          id="resume-upload"
          disabled={status === 'uploading'}
        />
        <div className="flex flex-col items-center gap-3">
          {file ? (
            <FileText className="h-10 w-10 text-brand-500" />
          ) : (
            <Upload className="h-10 w-10 text-gray-400" />
          )}
          {file ? (
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
          ) : (
            <div>
              <p className="font-medium text-gray-700">Drop your resume here</p>
              <p className="text-sm text-gray-500 mt-1">or click to browse — PDF or DOCX, up to 5 MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Status messages */}
      {status === 'error' && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Upload failed</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {status === 'success' && result && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2 text-green-800 mb-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Resume processed successfully</span>
          </div>
          <p className="text-sm text-green-700">
            Found <strong>{result.skillCount}</strong> skills
            {result.yearsOfExperience && `, ~${result.yearsOfExperience} years of experience`}.
          </p>
          {result.topSkills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {result.topSkills.map((s) => (
                <span key={s} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">{s}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {file && status !== 'success' && (
          <button
            onClick={handleUpload}
            disabled={status === 'uploading'}
            className="btn-primary flex-1"
          >
            {status === 'uploading' ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload resume
              </>
            )}
          </button>
        )}
        {(file || status === 'success') && (
          <button onClick={reset} className="btn-secondary">
            <X className="h-4 w-4" />
            {status === 'success' ? 'Upload another' : 'Clear'}
          </button>
        )}
      </div>
    </div>
  );
}


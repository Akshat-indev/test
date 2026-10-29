import { useState, useEffect } from 'react';
import { BookMarked, Trash2, ExternalLink, Building2, MapPin } from 'lucide-react';
import { savedJobsApi } from '../services/api.js';
import { PageSkeleton } from '../components/LoadingSkeleton.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { Link } from 'react-router-dom';

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    savedJobsApi.list()
      .then((data) => setSavedJobs(data.savedJobs || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRemove = async (savedJobId, jobId) => {
    try {
      await savedJobsApi.remove(jobId);
      setSavedJobs((prev) => prev.filter((sj) => sj.id !== savedJobId));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Saved jobs</h1>
        <p className="text-gray-500 text-sm">{savedJobs.length} job{savedJobs.length !== 1 ? 's' : ''} saved</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <PageSkeleton count={3} />
      ) : savedJobs.length === 0 ? (
        <EmptyState
          icon={<BookMarked className="h-12 w-12" />}
          title="No saved jobs yet"
          description="Browse jobs and click the bookmark icon to save listings for later."
          action={<Link to="/jobs" className="btn-primary">Browse jobs</Link>}
        />
      ) : (
        <div className="grid gap-4">
          {savedJobs.map((sj) => {
            const job = sj.jobs;
            if (!job) return null;
            return (
              <div key={sj.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{job.company_name}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                    </div>
                    {job.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{job.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(sj.id, job.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  {job.application_url && job.provider !== 'demo' && (
                    <a href={job.application_url} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs py-1.5">
                      <ExternalLink className="h-3.5 w-3.5" />Apply now
                    </a>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">Saved {new Date(sj.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


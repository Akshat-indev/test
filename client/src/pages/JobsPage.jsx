import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { jobsApi } from '../services/api.js';
import JobCard from '../components/JobCard.jsx';
import LocationSelector from '../components/LocationSelector.jsx';
import { PageSkeleton } from '../components/LoadingSkeleton.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';

const WORK_MODES = ['', 'remote', 'hybrid', 'onsite'];
const EMPLOYMENT_TYPES = ['', 'full_time', 'part_time', 'contract'];

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isDemo, setIsDemo] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchJobs = useCallback(async (reset = false) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: reset ? 1 : page, limit: 20 };
      if (query) params.query = query;
      if (location) params.location = location;
      if (workMode) params.work_mode = workMode;

      const data = await jobsApi.list(params);
      setJobs(data.jobs || []);
      setTotal(data.totalResults || 0);
      setIsDemo(data.isDemo);
      if (reset) setPage(1);
    } catch (err) {
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [query, location, workMode, page]);

  useEffect(() => { fetchJobs(true); }, [location, workMode]);
  useEffect(() => { fetchJobs(); }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs(true);
  };

  return (
    <div className="page-container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Browse jobs</h1>
        <p className="text-gray-500 text-sm">
          {total > 0 ? `${total} jobs found` : 'Search and filter to discover opportunities'}
          {isDemo && <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">Demo data</span>}
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Job title, skill, or keyword…"
            className="input pl-9"
          />
        </div>
        <button type="submit" className="btn-primary px-4">Search</button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary px-3 ${showFilters ? 'bg-gray-100' : ''}`}
        >
          <Filter className="h-4 w-4" />
        </button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 mb-4 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Location</label>
            <LocationSelector value={location} onChange={setLocation} />
          </div>
          <div>
            <label className="label">Work arrangement</label>
            <select value={workMode} onChange={(e) => setWorkMode(e.target.value)} className="input">
              <option value="">Any</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>
          </div>
          {(location || workMode) && (
            <div className="sm:col-span-2">
              <button
                onClick={() => { setLocation(''); setWorkMode(''); }}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={() => fetchJobs(true)} />}

      {loading ? (
        <PageSkeleton count={5} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title="No jobs found"
          description="Try a different search term or location."
          action={<button onClick={() => { setQuery(''); setLocation(''); setWorkMode(''); fetchJobs(true); }} className="btn-secondary">Clear search</button>}
        />
      ) : (
        <>
          <div className="grid gap-4">
            {jobs.map((job, i) => (
              <JobCard key={job.externalJobId || job.id || i} job={job} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="btn-secondary"
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={jobs.length < 20 || loading}
              className="btn-secondary"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}


import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, MapPin, Upload, Briefcase, Search, BookMarked, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { recommendationsApi, profileApi, resumeApi } from '../services/api.js';
import JobCard from '../components/JobCard.jsx';
import { PageSkeleton } from '../components/LoadingSkeleton.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function DashboardPage() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [resumeSummary, setResumeSummary] = useState(null);

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [profileRes, resumeRes] = await Promise.allSettled([
        profileApi.get(),
        resumeApi.getLatest(),
      ]);

      const prof = profileRes.status === 'fulfilled' ? profileRes.value?.profile : null;
      const res = resumeRes.status === 'fulfilled' ? resumeRes.value?.resume : null;
      setProfile(prof);
      setResume(res);

      if (res?.parsing_status === 'success') {
        const recsRes = await recommendationsApi.get({
          location: prof?.preferred_location || 'Bengaluru',
        });
        setRecommendations(recsRes.recommendations || []);
        setIsDemo(recsRes.isDemo);
        setResumeSummary(recsRes.resumeSummary);
      }
    } catch (err) {
      if (err.status !== 404) {
        setError(err.message || 'Failed to load recommendations');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const hasResume = resume?.parsing_status === 'success';

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good {getTimeOfDay()}, {firstName} 👋</h1>
          {profile?.preferred_location && (
            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              Showing jobs in {profile.preferred_location}
            </p>
          )}
        </div>
        {hasResume && (
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="btn-secondary"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh recommendations'}
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <SummaryCard
          icon={<Upload className="h-5 w-5 text-brand-600" />}
          label="Resume"
          value={hasResume ? `${resumeSummary?.skillCount || 0} skills found` : 'Not uploaded'}
          action={!hasResume ? <Link to="/onboarding" className="text-xs text-brand-600 hover:underline">Upload now →</Link> : null}
        />
        <SummaryCard
          icon={<MapPin className="h-5 w-5 text-brand-600" />}
          label="Location"
          value={profile?.preferred_location || 'Not set'}
          action={<Link to="/profile" className="text-xs text-brand-600 hover:underline">Change →</Link>}
        />
        <SummaryCard
          icon={<Briefcase className="h-5 w-5 text-brand-600" />}
          label="Matched jobs"
          value={loading ? '…' : recommendations.length}
        />
      </div>

      {error && <ErrorMessage message={error} onRetry={() => loadData()} />}

      {/* Demo notice */}
      {isDemo && !loading && (
        <div className="flex items-start gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6 text-sm text-amber-800">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Demo mode:</strong> These are sample jobs for illustration. Configure an Adzuna API key in the backend to see real listings.{' '}
            <a href="https://developer.adzuna.com" target="_blank" rel="noopener noreferrer" className="underline">Get an API key →</a>
          </p>
        </div>
      )}

      {/* Recommendations */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recommended for you</h2>
        <Link to="/jobs" className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1">
          <Search className="h-3.5 w-3.5" />
          Browse all jobs
        </Link>
      </div>

      {loading ? (
        <PageSkeleton count={3} />
      ) : !hasResume ? (
        <EmptyState
          icon={<Upload className="h-12 w-12" />}
          title="Upload your resume to get started"
          description="CareerMatch needs your resume to generate personalized job recommendations."
          action={<Link to="/onboarding" className="btn-primary">Upload resume</Link>}
        />
      ) : recommendations.length === 0 ? (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title="No matches found"
          description="Try changing your location or refreshing. Job availability may be limited for your current preferences."
          action={<button onClick={() => loadData(true)} className="btn-secondary"><RefreshCw className="h-4 w-4" />Refresh</button>}
        />
      ) : (
        <div className="grid gap-4">
          {recommendations.slice(0, 6).map((job, i) => (
            <JobCard key={job.externalJobId || i} job={job} showMatch />
          ))}
          {recommendations.length > 6 && (
            <Link to="/jobs" className="btn-secondary w-full justify-center">
              <BookMarked className="h-4 w-4" />
              View all {recommendations.length} matches
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, action }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
        {action}
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}


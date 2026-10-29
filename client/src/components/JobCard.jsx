import { useState } from 'react';
import { Building2, MapPin, Clock, ExternalLink, Bookmark, BookmarkCheck, Briefcase, Monitor } from 'lucide-react';
import MatchScore from './MatchScore.jsx';
import MatchExplanation from './MatchExplanation.jsx';
import { savedJobsApi } from '../services/api.js';
import { Link } from 'react-router-dom';

const WORK_MODE_LABELS = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'Onsite' };
const WORK_MODE_COLORS = {
  remote: 'text-green-700 bg-green-50',
  hybrid: 'text-blue-700 bg-blue-50',
  onsite: 'text-gray-600 bg-gray-100',
};

export default function JobCard({ job, showMatch = false, initialSaved = false, onSaveToggle }) {
  const [saved, setSaved] = useState(initialSaved);
  const [saving, setSaving] = useState(false);

  const handleSaveToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSaving(true);
    try {
      if (saved) {
        await savedJobsApi.remove(job.id || job.externalJobId);
        setSaved(false);
      } else {
        await savedJobsApi.save(job.id || job.externalJobId, job);
        setSaved(true);
      }
      onSaveToggle?.(job, !saved);
    } catch (err) {
      console.error('Failed to toggle save:', err);
    } finally {
      setSaving(false);
    }
  };

  const postedDate = job.postedAt || job.posted_at;
  const daysAgo = postedDate
    ? Math.floor((Date.now() - new Date(postedDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isDemo = job.provider === 'demo';

  return (
    <div className="card p-5 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-base leading-tight truncate">
              {job.title}
            </h3>
            {isDemo && (
              <span className="shrink-0 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-medium">
                Demo
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {job.companyName || job.company_name}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {job.location}
            </span>
            {daysAgo !== null && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
              </span>
            )}
            {job.workMode && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${WORK_MODE_COLORS[job.workMode] || 'bg-gray-100 text-gray-600'}`}>
                <Monitor className="h-3 w-3" />
                {WORK_MODE_LABELS[job.workMode] || job.workMode}
              </span>
            )}
            {(job.employmentType || job.employment_type) && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                <Briefcase className="h-3 w-3" />
                {job.employmentType || job.employment_type}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {showMatch && job.matchScore != null && (
            <MatchScore score={job.matchScore} />
          )}
          <button
            onClick={handleSaveToggle}
            disabled={saving}
            className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors disabled:opacity-60"
            title={saved ? 'Remove from saved' : 'Save job'}
            aria-label={saved ? 'Remove from saved jobs' : 'Save this job'}
          >
            {saved ? <BookmarkCheck className="h-5 w-5 text-brand-600" /> : <Bookmark className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Description snippet */}
      {job.description && (
        <p className="text-sm text-gray-600 mt-3 line-clamp-2 leading-relaxed">
          {job.description}
        </p>
      )}

      {/* Match explanation */}
      {showMatch && job.matchExplanation && (
        <div className="mt-3">
          <MatchExplanation
            explanation={job.matchExplanation}
            matchedSkills={job.matchedSkills || []}
            missingSkills={job.missingSkills || []}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
        {job.applicationUrl && (
          <a
            href={job.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs py-1.5"
            onClick={(e) => isDemo && e.preventDefault()}
            title={isDemo ? 'Demo job — no real application link' : 'Open application page'}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {isDemo ? 'Demo link' : 'Apply now'}
          </a>
        )}
        <span className="text-xs text-gray-400 ml-auto">via {job.provider || job.source}</span>
      </div>
    </div>
  );
}


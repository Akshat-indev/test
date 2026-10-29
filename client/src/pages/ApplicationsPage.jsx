import { useState, useEffect } from 'react';
import { Briefcase, ChevronDown, Trash2, ExternalLink, Building2, AlertCircle } from 'lucide-react';
import { applicationsApi } from '../services/api.js';
import { PageSkeleton } from '../components/LoadingSkeleton.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { Link } from 'react-router-dom';

const STATUS_CONFIG = {
  saved: { label: 'Saved', color: 'bg-gray-100 text-gray-700' },
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-700' },
  interviewing: { label: 'Interviewing', color: 'bg-purple-100 text-purple-700' },
  offered: { label: 'Offered', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-500' },
};

const STATUSES = Object.keys(STATUS_CONFIG);

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');

  useEffect(() => {
    applicationsApi.list()
      .then((data) => setApplications(data.applications || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (id) => {
    try {
      const updated = await applicationsApi.update(id, { status: editStatus, notes: editNotes });
      setApplications((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updated.application } : a))
      );
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this application from your tracker?')) return;
    try {
      await applicationsApi.delete(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (app) => {
    setEditingId(app.id);
    setEditStatus(app.status);
    setEditNotes(app.notes || '');
  };

  return (
    <div className="page-container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Application tracker</h1>
        <p className="text-gray-500 text-sm">
          Track your job applications and keep notes on each one.{' '}
          <span className="inline-flex items-center gap-1 text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" />
            Status is self-reported and not verified by employers.
          </span>
        </p>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Status summary */}
      {applications.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUSES.map((s) => {
            const count = applications.filter((a) => a.status === s).length;
            if (count === 0) return null;
            return (
              <span key={s} className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[s].color}`}>
                {STATUS_CONFIG[s].label}: {count}
              </span>
            );
          })}
        </div>
      )}

      {loading ? (
        <PageSkeleton count={3} />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-12 w-12" />}
          title="No applications tracked"
          description="Save jobs and track your application status here."
          action={<Link to="/jobs" className="btn-primary">Browse jobs</Link>}
        />
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => {
            const job = app.jobs;
            const isEditing = editingId === app.id;
            const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.saved;

            return (
              <div key={app.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {job?.provider === 'demo' && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">Demo</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">{job?.title || 'Unknown position'}</h3>
                    {job && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                        <Building2 className="h-3.5 w-3.5" />
                        {job.company_name}
                      </div>
                    )}
                    {app.notes && !isEditing && (
                      <p className="text-sm text-gray-600 mt-2 italic">"{app.notes}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => isEditing ? setEditingId(null) : startEdit(app)}
                      className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isEditing ? 'rotate-180' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(app.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <div>
                      <label className="label">Status</label>
                      <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="input">
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Notes</label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="input resize-none"
                        rows={2}
                        placeholder="Interview scheduled for Monday…"
                        maxLength={2000}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(app.id)} className="btn-primary text-sm py-1.5">Save</button>
                      <button onClick={() => setEditingId(null)} className="btn-secondary text-sm py-1.5">Cancel</button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  {job?.application_url && job?.provider !== 'demo' && (
                    <a href={job.application_url} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs py-1.5">
                      <ExternalLink className="h-3.5 w-3.5" />Open application
                    </a>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    Updated {new Date(app.updated_at || app.applied_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


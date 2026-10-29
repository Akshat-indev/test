import { useState, useEffect } from 'react';
import { User, MapPin, Briefcase, FileText, Save, Trash2, Eye } from 'lucide-react';
import { profileApi, resumeApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import LocationSelector from '../components/LocationSelector.jsx';
import ResumeUploader from '../components/ResumeUploader.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showUploader, setShowUploader] = useState(false);

  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [jobTitles, setJobTitles] = useState('');
  const [workMode, setWorkMode] = useState('');

  useEffect(() => {
    Promise.allSettled([profileApi.get(), resumeApi.getLatest()])
      .then(([profRes, resumeRes]) => {
        if (profRes.status === 'fulfilled') {
          const p = profRes.value?.profile;
          setProfile(p);
          setFullName(p?.full_name || '');
          setLocation(p?.preferred_location || '');
          setJobTitles((p?.preferred_job_titles || []).join(', '));
          setWorkMode((p?.preferred_work_modes || [])[0] || '');
        }
        if (resumeRes.status === 'fulfilled') {
          setResume(resumeRes.value?.resume);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await profileApi.update({
        full_name: fullName,
        preferred_location: location,
        preferred_job_titles: jobTitles.split(',').map((t) => t.trim()).filter(Boolean),
        preferred_work_modes: workMode ? [workMode] : [],
      });
      setProfile(updated.profile);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!resume || !confirm('Delete your current resume? This will also clear job recommendations.')) return;
    try {
      await resumeApi.delete(resume.id);
      setResume(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="page-container py-8 text-gray-500">Loading profile…</div>;

  const skills = resume?.extracted_skills?.skills || [];

  return (
    <div className="page-container py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile & Settings</h1>

      {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          {success}
        </div>
      )}

      {/* Profile form */}
      <section className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-brand-600" />
          Personal information
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" placeholder="Your name" />
          </div>
          <div>
            <label className="label">Email address</label>
            <input type="email" value={user?.email || ''} disabled className="input bg-gray-50 text-gray-500 cursor-not-allowed" />
            <p className="text-xs text-gray-400 mt-1">Email is managed by Supabase Auth and cannot be changed here.</p>
          </div>
          <div>
            <label className="label flex items-center gap-1">
              <MapPin className="h-4 w-4" />Preferred location
            </label>
            <LocationSelector value={location} onChange={setLocation} />
          </div>
          <div>
            <label className="label flex items-center gap-1">
              <Briefcase className="h-4 w-4" />Preferred job titles
            </label>
            <input
              type="text"
              value={jobTitles}
              onChange={(e) => setJobTitles(e.target.value)}
              className="input"
              placeholder="Software Engineer, Backend Developer, …"
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated list</p>
          </div>
          <div>
            <label className="label">Work arrangement preference</label>
            <select value={workMode} onChange={(e) => setWorkMode(e.target.value)} className="input">
              <option value="">Any</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>

      {/* Resume section */}
      <section className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-600" />
          Resume
        </h2>

        {resume ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900 text-sm">{resume.original_filename}</p>
                <p className="text-xs text-gray-500">
                  Uploaded {new Date(resume.created_at).toLocaleDateString()} · {resume.parsing_status}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowUploader(!showUploader)} className="btn-secondary text-xs py-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  Replace
                </button>
                <button onClick={handleDeleteResume} className="btn-danger text-xs py-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>

            {skills.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Extracted skills ({skills.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-brand-50 text-brand-700 text-xs rounded-full font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {showUploader && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <ResumeUploader
                  onSuccess={(r) => { setResume(r); setShowUploader(false); }}
                />
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-4">No resume uploaded yet. Upload a PDF or DOCX to enable job matching.</p>
            <ResumeUploader onSuccess={setResume} />
          </div>
        )}
      </section>

      {/* Account actions */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
        <p className="text-sm text-gray-500 mb-3">
          To delete your account and all associated data, contact support or use the Supabase user management portal.
        </p>
        <Link to="/dashboard" className="btn-secondary text-sm">← Back to dashboard</Link>
      </section>
    </div>
  );
}


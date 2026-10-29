import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Upload, MapPin, Settings } from 'lucide-react';
import ResumeUploader from '../components/ResumeUploader.jsx';
import LocationSelector from '../components/LocationSelector.jsx';
import { profileApi } from '../services/api.js';

const STEPS = ['Upload Resume', 'Set Location', 'Preferences'];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [resume, setResume] = useState(null);
  const [location, setLocation] = useState('');
  const [jobTitles, setJobTitles] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleResumeSuccess = (r) => {
    setResume(r);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await profileApi.update({
        preferred_location: location,
        preferred_job_titles: jobTitles ? jobTitles.split(',').map((t) => t.trim()).filter(Boolean) : [],
        preferred_work_modes: workMode ? [workMode] : [],
      });
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save profile:', err);
      navigate('/dashboard');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-semibold transition-colors ${
                  i < step ? 'bg-brand-600 text-white' :
                  i === step ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${i < step ? 'bg-brand-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            {STEPS.map((s) => <span key={s}>{s}</span>)}
          </div>
        </div>

        {/* Step content */}
        <div className="card p-6">
          {step === 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Upload className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-bold text-gray-900">Upload your resume</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                We'll extract your skills, experience, and education to personalize job matches.
                Supported formats: PDF and DOCX, up to 5 MB.
              </p>
              <ResumeUploader onSuccess={handleResumeSuccess} />
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(1)}
                  disabled={!resume}
                  className="btn-primary"
                >
                  Next: Set location →
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-bold text-gray-900">Where are you looking?</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Choose your preferred work location. This is used as a real filter — jobs in other cities are not mixed in.
              </p>
              <label className="label">Preferred location</label>
              <LocationSelector value={location} onChange={setLocation} />
              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(0)} className="btn-secondary">← Back</button>
                <button onClick={() => setStep(2)} disabled={!location} className="btn-primary">
                  Next: Preferences →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Settings className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-bold text-gray-900">Job preferences (optional)</h2>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                These help us narrow down recommendations. You can update them later in your profile.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="label">Preferred job titles (comma-separated)</label>
                  <input
                    type="text"
                    value={jobTitles}
                    onChange={(e) => setJobTitles(e.target.value)}
                    className="input"
                    placeholder="Software Engineer, Frontend Developer, …"
                  />
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
              </div>
              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(1)} className="btn-secondary">← Back</button>
                <button onClick={handleFinish} disabled={saving} className="btn-primary">
                  {saving ? 'Saving…' : 'Go to dashboard →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


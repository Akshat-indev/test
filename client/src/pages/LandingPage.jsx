import { Link } from 'react-router-dom';
import { Briefcase, Search, Star, ArrowRight, CheckCircle, MapPin, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-medium mb-6">
            <Star className="h-3.5 w-3.5" />
            Resume-powered job matching
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-6">
            Find jobs that actually <span className="text-brand-600">match your skills</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload your resume, choose your preferred city, and CareerMatch surfaces relevant job listings
            with a clear explanation of why each role fits your background — no guesswork.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to={isAuthenticated ? '/dashboard' : '/signup'}
              className="btn-primary px-8 py-3 text-base"
            >
              Get started for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/jobs" className="btn-secondary px-8 py-3 text-base">
              Browse jobs
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">How CareerMatch works</h2>
            <p className="text-gray-600">Three steps to discover relevant opportunities</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Step
              number="1"
              icon={<FileText className="h-6 w-6" />}
              title="Upload your resume"
              description="We extract your skills, experience, and job history from PDF or DOCX files. No manual data entry needed."
            />
            <Step
              number="2"
              icon={<MapPin className="h-6 w-6" />}
              title="Choose your location"
              description="Select your preferred city — Mumbai, Bengaluru, Hyderabad, Delhi, Pune, Chennai, and more."
            />
            <Step
              number="3"
              icon={<Search className="h-6 w-6" />}
              title="Get matched jobs"
              description="See ranked job listings with a match score and a plain-English explanation of why each role fits."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Built for honest job searching</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: 'Explainable matching', desc: 'Every recommendation includes the specific skills and experience factors that drove the match score.' },
              { title: 'Real job listings', desc: 'Listings come from the Adzuna API. When credentials are unavailable, demo mode is clearly labeled.' },
              { title: 'Application tracker', desc: 'Track every job from saved → applied → interviewing → offered, with personal notes.' },
              { title: 'Location-aware search', desc: 'Location is a genuine filter, not a keyword. Jobs in the wrong city are never silently included.' },
              { title: 'Private by default', desc: 'Your resume data is stored as structured information only. Raw resume text is not retained.' },
              { title: 'No fabricated data', desc: 'No invented testimonials, fake statistics, or sample data presented as live listings.' },
            ].map((f) => (
              <div key={f.title} className="card p-5">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-brand-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to find a better fit?</h2>
          <p className="text-gray-600 mb-8">
            Recommendations depend on uploading a resume and selecting a location.
            The match quality improves as you provide more profile information.
          </p>
          <Link to={isAuthenticated ? '/onboarding' : '/signup'} className="btn-primary px-8 py-3 text-base">
            Upload your resume
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-8 px-4 text-center text-sm text-gray-400">
        <p>© {new Date().getFullYear()} CareerMatch. Match scores are relevance indicators, not hiring probabilities.</p>
      </footer>
    </div>
  );
}

function Step({ number, icon, title, description }) {
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-brand-100 text-brand-600 mb-4">
        {icon}
      </div>
      <div className="text-xs font-bold text-brand-600 mb-2">STEP {number}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}


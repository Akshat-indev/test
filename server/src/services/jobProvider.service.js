import { env } from '../config/env.js';

// Supported Indian cities with their Adzuna location strings
export const SUPPORTED_LOCATIONS = {
  mumbai: { display: 'Mumbai', adzuna: 'Mumbai' },
  bengaluru: { display: 'Bengaluru', adzuna: 'Bengaluru' },
  bangalore: { display: 'Bengaluru', adzuna: 'Bengaluru' },
  hyderabad: { display: 'Hyderabad', adzuna: 'Hyderabad' },
  chennai: { display: 'Chennai', adzuna: 'Chennai' },
  pune: { display: 'Pune', adzuna: 'Pune' },
  delhi: { display: 'Delhi', adzuna: 'Delhi' },
  'new delhi': { display: 'Delhi', adzuna: 'Delhi' },
  noida: { display: 'Noida', adzuna: 'Noida' },
  gurgaon: { display: 'Gurgaon', adzuna: 'Gurgaon' },
  gurugram: { display: 'Gurgaon', adzuna: 'Gurgaon' },
  kolkata: { display: 'Kolkata', adzuna: 'Kolkata' },
  remote: { display: 'Remote', adzuna: null },
};

/**
 * Normalize a raw job object from Adzuna into the internal format.
 */
function normalizeAdzunaJob(raw) {
  return {
    externalJobId: raw.id,
    title: raw.title || 'Untitled',
    companyName: raw.company?.display_name || 'Unknown Company',
    location: raw.location?.display_name || 'India',
    description: raw.description || '',
    requiredSkills: [],
    employmentType: raw.contract_type || null,
    workMode: raw.contract_time === 'full_time' ? 'onsite' : null,
    applicationUrl: raw.redirect_url || null,
    postedAt: raw.created ? new Date(raw.created).toISOString() : null,
    salaryMin: raw.salary_min || null,
    salaryMax: raw.salary_max || null,
    provider: 'adzuna',
    lastSeenAt: new Date().toISOString(),
  };
}

/**
 * Fetch jobs from Adzuna API.
 * Returns normalized job objects.
 */
async function fetchFromAdzuna({ location, query, page = 1, limit = 20 }) {
  const { ADZUNA_APP_ID, ADZUNA_APP_KEY } = env;
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    return { jobs: [], source: 'adzuna', error: 'No API credentials' };
  }

  const locationInfo = SUPPORTED_LOCATIONS[location?.toLowerCase()];
  const locationQuery = locationInfo?.adzuna || location || 'India';

  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: ADZUNA_APP_KEY,
    results_per_page: String(limit),
    what: query || 'software developer',
    where: locationQuery,
    content_type: 'application/json',
  });

  const url = `https://api.adzuna.com/v1/api/jobs/in/search/${page}?${params}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.error('[Adzuna] API error:', response.status, text);
      return { jobs: [], source: 'adzuna', error: `Adzuna API error: ${response.status}` };
    }

    const data = await response.json();
    const jobs = (data.results || []).map(normalizeAdzunaJob);
    return { jobs, source: 'adzuna', totalResults: data.count || 0, error: null };
  } catch (err) {
    console.error('[Adzuna] Fetch failed:', err.message);
    return { jobs: [], source: 'adzuna', error: err.message };
  }
}

// Demo jobs shown when no API key is configured
const DEMO_JOBS = [
  {
    externalJobId: 'demo-001',
    title: 'Senior Software Engineer',
    companyName: 'TechCorp India',
    location: 'Bengaluru, India',
    description: 'We are looking for a Senior Software Engineer with expertise in React, Node.js, and PostgreSQL. You will design and build scalable web applications, collaborate with cross-functional teams, and mentor junior developers. Experience with cloud platforms (AWS/GCP) and microservices architecture is a plus.',
    requiredSkills: ['react', 'node.js', 'postgresql', 'aws', 'javascript', 'rest api'],
    employmentType: 'Full-time',
    workMode: 'hybrid',
    applicationUrl: 'https://example.com/apply/demo-001',
    postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    provider: 'demo',
    lastSeenAt: new Date().toISOString(),
  },
  {
    externalJobId: 'demo-002',
    title: 'Data Scientist',
    companyName: 'Analytics Hub',
    location: 'Mumbai, India',
    description: 'Join our data science team to build ML models that drive business decisions. You will work with large datasets, develop predictive models using Python and TensorFlow, and present insights to stakeholders. Strong background in statistics and SQL required.',
    requiredSkills: ['python', 'machine learning', 'tensorflow', 'sql', 'pandas', 'numpy'],
    employmentType: 'Full-time',
    workMode: 'onsite',
    applicationUrl: 'https://example.com/apply/demo-002',
    postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    provider: 'demo',
    lastSeenAt: new Date().toISOString(),
  },
  {
    externalJobId: 'demo-003',
    title: 'Frontend Developer',
    companyName: 'WebWave Solutions',
    location: 'Hyderabad, India',
    description: 'Build beautiful, responsive web interfaces using React and TypeScript. Work closely with designers and backend engineers to deliver polished user experiences. Experience with state management (Redux/Zustand), CSS frameworks, and testing is required.',
    requiredSkills: ['react', 'typescript', 'javascript', 'css', 'html', 'tailwind'],
    employmentType: 'Full-time',
    workMode: 'remote',
    applicationUrl: 'https://example.com/apply/demo-003',
    postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    provider: 'demo',
    lastSeenAt: new Date().toISOString(),
  },
  {
    externalJobId: 'demo-004',
    title: 'DevOps Engineer',
    companyName: 'CloudBase Systems',
    location: 'Pune, India',
    description: 'Manage cloud infrastructure, CI/CD pipelines, and Kubernetes clusters. Collaborate with development teams to streamline deployment processes. Strong experience with AWS, Docker, Terraform, and monitoring tools (Grafana, Prometheus) required.',
    requiredSkills: ['aws', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'linux'],
    employmentType: 'Full-time',
    workMode: 'hybrid',
    applicationUrl: 'https://example.com/apply/demo-004',
    postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    provider: 'demo',
    lastSeenAt: new Date().toISOString(),
  },
  {
    externalJobId: 'demo-005',
    title: 'Backend Developer (Python)',
    companyName: 'Fintech Innovations',
    location: 'Chennai, India',
    description: 'Develop robust backend services for our financial platform using Python and FastAPI. Design RESTful APIs, integrate with PostgreSQL, and ensure high availability. Knowledge of security best practices and experience with Redis caching is preferred.',
    requiredSkills: ['python', 'fastapi', 'postgresql', 'redis', 'rest api', 'docker'],
    employmentType: 'Full-time',
    workMode: 'onsite',
    applicationUrl: 'https://example.com/apply/demo-005',
    postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    provider: 'demo',
    lastSeenAt: new Date().toISOString(),
  },
  {
    externalJobId: 'demo-006',
    title: 'Mobile App Developer (Flutter)',
    companyName: 'AppStudio Delhi',
    location: 'Delhi, India',
    description: 'Create cross-platform mobile applications using Flutter and Dart. Work on feature development, performance optimization, and app store releases. Experience with state management (BLoC/Provider) and REST API integration required.',
    requiredSkills: ['flutter', 'dart', 'mobile developer', 'android', 'ios', 'rest api'],
    employmentType: 'Full-time',
    workMode: 'hybrid',
    applicationUrl: 'https://example.com/apply/demo-006',
    postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    provider: 'demo',
    lastSeenAt: new Date().toISOString(),
  },
];

/**
 * Main job provider service.
 * Uses Adzuna when configured; falls back to clearly labeled demo data.
 */
export async function fetchJobs({ location, query, page = 1, limit = 20, skills = [] }) {
  const hasAdzunaCredentials = !!(env.ADZUNA_APP_ID && env.ADZUNA_APP_KEY);

  if (hasAdzunaCredentials) {
    const result = await fetchFromAdzuna({ location, query, page, limit });
    if (result.jobs.length > 0) {
      return { ...result, isDemo: false };
    }
    // Fall through to demo if Adzuna returns nothing
    console.warn('[JobProvider] Adzuna returned no results, showing demo data');
  }

  // Filter demo jobs by location if specified
  let filtered = DEMO_JOBS;
  if (location && location.toLowerCase() !== 'remote') {
    filtered = DEMO_JOBS.filter((j) =>
      j.location.toLowerCase().includes(location.toLowerCase())
    );
    // If no match by location, show all demos
    if (filtered.length === 0) filtered = DEMO_JOBS;
  }

  return {
    jobs: filtered,
    source: 'demo',
    totalResults: filtered.length,
    isDemo: true,
    error: null,
  };
}


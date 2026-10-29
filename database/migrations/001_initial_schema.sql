-- CareerMatch Database Migration V1
-- Run in Supabase SQL Editor in order
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: profiles
-- User preferences and display info (one per auth user)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  preferred_location TEXT,
  preferred_job_titles TEXT[] DEFAULT '{}',
  preferred_employment_types TEXT[] DEFAULT '{}',
  preferred_work_modes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- ============================================================
-- Table: resumes
-- Processed resume data (structured only, no raw text retained)
-- ============================================================
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  extracted_skills JSONB DEFAULT '{}',
  extracted_experience JSONB DEFAULT '[]',
  extracted_education JSONB DEFAULT '{}',
  extracted_projects JSONB DEFAULT '[]',
  parsing_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (parsing_status IN ('pending', 'processing', 'success', 'failed')),
  parsing_error TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_status ON resumes(parsing_status);

-- ============================================================
-- Table: jobs
-- Normalized job listings from external providers
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  external_job_id TEXT NOT NULL,
  title TEXT NOT NULL,
  company_name TEXT,
  location TEXT,
  description TEXT,
  required_skills TEXT[] DEFAULT '{}',
  employment_type TEXT,
  work_mode TEXT CHECK (work_mode IN ('remote', 'hybrid', 'onsite', NULL)),
  application_url TEXT,
  posted_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  salary_min NUMERIC,
  salary_max NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate listings from the same provider
  CONSTRAINT unique_provider_job UNIQUE (provider, external_job_id)
);

CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_provider ON jobs(provider);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs(posted_at DESC);

-- ============================================================
-- Table: saved_jobs
-- User's bookmarked job listings
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate saves
  CONSTRAINT unique_user_saved_job UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);

-- ============================================================
-- Table: applications
-- User's job application tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'saved'
    CHECK (status IN ('saved', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn')),
  notes TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One application record per user+job
  CONSTRAINT unique_user_application UNIQUE (user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Profiles: users can only see and modify their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: owner access only"
  ON profiles FOR ALL
  USING (auth.uid() = id);

-- Resumes: users can only access their own resumes
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resumes: owner read"
  ON resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "resumes: owner insert"
  ON resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "resumes: owner update"
  ON resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "resumes: owner delete"
  ON resumes FOR DELETE
  USING (auth.uid() = user_id);

-- Jobs: readable by all authenticated users; writable only by service role (backend)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs: authenticated users can read"
  ON jobs FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Saved jobs: users can only access their own saved jobs
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_jobs: owner access only"
  ON saved_jobs FOR ALL
  USING (auth.uid() = user_id);

-- Applications: users can only access their own applications
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applications: owner access only"
  ON applications FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- Updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


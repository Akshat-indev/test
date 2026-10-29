import { supabase } from '../config/supabase.js';
import { fetchJobs } from './jobProvider.service.js';
import { rankJobs } from './jobMatching.service.js';

/**
 * Generates job recommendations for a user.
 * 1. Loads the user's latest parsed resume from the database.
 * 2. Loads the user's profile for location/preferences.
 * 3. Fetches jobs from the provider.
 * 4. Ranks them with the matching algorithm.
 * 5. Returns ranked results.
 */
export async function generateRecommendations(userId, overrides = {}) {
  // Load latest resume
  const { data: resume, error: resumeError } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .eq('parsing_status', 'success')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (resumeError) throw Object.assign(new Error('Failed to load resume'), { status: 500 });
  if (!resume) throw Object.assign(new Error('No processed resume found. Please upload a resume first.'), { status: 404 });

  // Load profile for preferences
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  const location = overrides.location || profile?.preferred_location || 'Bengaluru';
  const jobTitleQuery = overrides.query || (profile?.preferred_job_titles?.[0]) || (resume.extracted_skills?.jobTitles?.[0]) || 'software developer';

  // Build resume profile for matching
  const resumeProfile = {
    skills: resume.extracted_skills?.skills || [],
    jobTitles: resume.extracted_skills?.jobTitles || [],
    yearsOfExperience: resume.extracted_skills?.yearsOfExperience || null,
    education: resume.extracted_skills?.education || {},
    experience: resume.extracted_skills?.experience || [],
  };

  const { jobs, isDemo, source, totalResults } = await fetchJobs({
    location,
    query: jobTitleQuery,
    page: overrides.page || 1,
    limit: overrides.limit || 20,
    skills: resumeProfile.skills,
  });

  const ranked = rankJobs(jobs, resumeProfile, location);

  return {
    recommendations: ranked,
    location,
    query: jobTitleQuery,
    totalResults: totalResults || ranked.length,
    isDemo,
    source,
    resumeSummary: {
      skillCount: resumeProfile.skills.length,
      topSkills: resumeProfile.skills.slice(0, 8),
      yearsOfExperience: resumeProfile.yearsOfExperience,
    },
  };
}


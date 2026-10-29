import { supabase } from '../config/supabase.js';

export async function getSavedJobs(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select(`
        id,
        created_at,
        jobs (
          id, title, company_name, location, description,
          employment_type, work_mode, application_url, posted_at, provider, required_skills
        )
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ savedJobs: data });
  } catch (err) {
    next(err);
  }
}

export async function saveJob(req, res, next) {
  try {
    const { jobId, jobData } = req.body;

    if (!jobId) return res.status(400).json({ error: 'jobId is required' });

    // If job doesn't exist in our DB, insert it first (from provider data)
    if (jobData) {
      await supabase.from('jobs').upsert(
        {
          id: jobId,
          provider: jobData.provider || 'demo',
          external_job_id: jobData.externalJobId || jobId,
          title: jobData.title,
          company_name: jobData.companyName,
          location: jobData.location,
          description: jobData.description,
          required_skills: jobData.requiredSkills || [],
          employment_type: jobData.employmentType,
          work_mode: jobData.workMode,
          application_url: jobData.applicationUrl,
          posted_at: jobData.postedAt,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'id', ignoreDuplicates: false }
      );
    }

    const { data, error } = await supabase
      .from('saved_jobs')
      .insert({ user_id: req.user.id, job_id: jobId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Job already saved' });
      }
      throw error;
    }

    res.status(201).json({ savedJob: data });
  } catch (err) {
    next(err);
  }
}

export async function unsaveJob(req, res, next) {
  try {
    const { jobId } = req.params;

    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('user_id', req.user.id)
      .eq('job_id', jobId);

    if (error) throw error;
    res.json({ message: 'Job removed from saved list' });
  } catch (err) {
    next(err);
  }
}


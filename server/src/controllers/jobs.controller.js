import { fetchJobs, SUPPORTED_LOCATIONS } from '../services/jobProvider.service.js';
import { supabase } from '../config/supabase.js';

export async function listJobs(req, res, next) {
  try {
    const { location, query, page = '1', limit = '20' } = req.query;

    const result = await fetchJobs({
      location,
      query,
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), 50),
    });

    res.json({
      jobs: result.jobs,
      totalResults: result.totalResults,
      isDemo: result.isDemo,
      source: result.source,
      page: parseInt(page, 10),
    });
  } catch (err) {
    next(err);
  }
}

export async function getJob(req, res, next) {
  try {
    const { id } = req.params;

    // Try to find in our database first
    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!job) return res.status(404).json({ error: 'Job not found' });

    res.json({ job });
  } catch (err) {
    next(err);
  }
}

export function getSupportedLocations(req, res) {
  const locations = Object.entries(SUPPORTED_LOCATIONS)
    .filter(([key, val]) => val.display !== SUPPORTED_LOCATIONS[key.replace('bangalore', 'bengaluru')]?.display || key === 'bengaluru' || !['bangalore', 'gurugram', 'new delhi'].includes(key))
    .map(([key, val]) => ({ key, display: val.display }));

  const unique = [...new Map(locations.map((l) => [l.display, l])).values()];
  res.json({ locations: unique });
}


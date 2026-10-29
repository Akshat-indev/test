import { supabase } from '../config/supabase.js';
import { z } from 'zod';

const VALID_STATUSES = ['saved', 'applied', 'interviewing', 'offered', 'rejected', 'withdrawn'];

const createSchema = z.object({
  jobId: z.string().uuid(),
  status: z.enum(VALID_STATUSES).default('saved'),
  notes: z.string().max(2000).optional(),
});

const updateSchema = z.object({
  status: z.enum(VALID_STATUSES).optional(),
  notes: z.string().max(2000).optional(),
});

export async function getApplications(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        id, status, notes, applied_at, updated_at,
        jobs (id, title, company_name, location, application_url, provider)
      `)
      .eq('user_id', req.user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.json({ applications: data });
  } catch (err) {
    next(err);
  }
}

export async function createApplication(req, res, next) {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
    }

    const { jobId, status, notes } = parsed.data;

    const { data, error } = await supabase
      .from('applications')
      .insert({
        user_id: req.user.id,
        job_id: jobId,
        status,
        notes,
        applied_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Application already exists for this job' });
      }
      throw error;
    }

    res.status(201).json({ application: data });
  } catch (err) {
    next(err);
  }
}

export async function updateApplication(req, res, next) {
  try {
    const { id } = req.params;
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Validation failed', details: parsed.error.errors });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('applications')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    if (!existing) return res.status(404).json({ error: 'Application not found' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    const { data, error } = await supabase
      .from('applications')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ application: data });
  } catch (err) {
    next(err);
  }
}

export async function deleteApplication(req, res, next) {
  try {
    const { id } = req.params;

    const { data: existing } = await supabase
      .from('applications')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();

    if (!existing) return res.status(404).json({ error: 'Application not found' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });

    await supabase.from('applications').delete().eq('id', id);
    res.json({ message: 'Application deleted' });
  } catch (err) {
    next(err);
  }
}


import { supabase } from '../config/supabase.js';

export async function getProfile(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // Create empty profile on first access
      const { data: created, error: createErr } = await supabase
        .from('profiles')
        .insert({ id: req.user.id, full_name: req.user.user_metadata?.full_name || null })
        .select()
        .single();
      if (createErr) throw createErr;
      return res.json({ profile: created });
    }

    res.json({ profile: data });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { full_name, preferred_location, preferred_job_titles, preferred_employment_types, preferred_work_modes } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: req.user.id,
          full_name,
          preferred_location,
          preferred_job_titles,
          preferred_employment_types,
          preferred_work_modes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) throw error;
    res.json({ profile: data });
  } catch (err) {
    next(err);
  }
}


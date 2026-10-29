import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Server-side Supabase client with service-role key
// NEVER expose this client or key to the frontend
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});


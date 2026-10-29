import { supabase } from '../config/supabase.js';

/**
 * Express middleware that verifies the Bearer token from the Authorization header.
 * On success, attaches req.user = { id, email, ... } from the Supabase JWT.
 * Never trusts a user_id from the request body.
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = data.user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token verification failed' });
  }
}


import { supabase } from './supabase.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Centralized API client.
 * Automatically attaches the current Supabase access token as a Bearer header.
 * Handles JSON and multipart/form-data uniformly.
 */
async function getAuthToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

async function apiFetch(path, options = {}) {
  const token = await getAuthToken();

  const headers = { ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      // Session expired — sign out
      await supabase.auth.signOut();
      window.location.href = '/login?expired=1';
      return;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const message = (isJson && data?.error) ? data.error : `HTTP ${response.status}`;
      const err = new Error(message);
      err.status = response.status;
      err.details = isJson ? data?.details : null;
      throw err;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  }
}

// ─── Profile ──────────────────────────────────────────────────────────────────
export const profileApi = {
  get: () => apiFetch('/profile'),
  update: (data) => apiFetch('/profile', { method: 'PATCH', body: JSON.stringify(data) }),
};

// ─── Resume ───────────────────────────────────────────────────────────────────
export const resumeApi = {
  upload: (file) => {
    const form = new FormData();
    form.append('resume', file);
    return apiFetch('/resumes/upload', { method: 'POST', body: form });
  },
  getLatest: () => apiFetch('/resumes/latest'),
  delete: (id) => apiFetch(`/resumes/${id}`, { method: 'DELETE' }),
};

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export const jobsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/jobs${qs ? `?${qs}` : ''}`);
  },
  get: (id) => apiFetch(`/jobs/${id}`),
  getLocations: () => fetch(`${API_BASE}/jobs/locations`).then((r) => r.json()),
};

// ─── Recommendations ──────────────────────────────────────────────────────────
export const recommendationsApi = {
  get: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/recommendations${qs ? `?${qs}` : ''}`);
  },
  generate: (params = {}) =>
    apiFetch('/recommendations/generate', { method: 'POST', body: JSON.stringify(params) }),
};

// ─── Saved Jobs ───────────────────────────────────────────────────────────────
export const savedJobsApi = {
  list: () => apiFetch('/saved-jobs'),
  save: (jobId, jobData) => apiFetch('/saved-jobs', { method: 'POST', body: JSON.stringify({ jobId, jobData }) }),
  remove: (jobId) => apiFetch(`/saved-jobs/${jobId}`, { method: 'DELETE' }),
};

// ─── Applications ─────────────────────────────────────────────────────────────
export const applicationsApi = {
  list: () => apiFetch('/applications'),
  create: (data) => apiFetch('/applications', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/applications/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/applications/${id}`, { method: 'DELETE' }),
};


import { useMemo } from 'react';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';

export async function apiRequest(path, options = {}, token) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export function useApi() {
  const { token } = useAuth();
  // Stable identity until token changes — avoids effects that depend on [api] re-running every render
  // and cancelling in-flight work without ever calling setLoading(false) (e.g. OnboardingSocialStep).
  return useMemo(
    () => ({
      get: (path) => apiRequest(path, { method: 'GET' }, token),
      post: (path, body) => apiRequest(path, { method: 'POST', body: JSON.stringify(body) }, token),
      patch: (path, body) => apiRequest(path, { method: 'PATCH', body: JSON.stringify(body) }, token),
      delete: (path) => apiRequest(path, { method: 'DELETE' }, token),
      patchForm: (path, formData) => uploadFormData(path, formData, token, 'PATCH'),
    }),
    [token]
  );
}

export async function uploadFormData(path, formData, token, method = 'POST') {
  const url = `${API_BASE}${path}`;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  // Do NOT set Content-Type — fetch sets it automatically with multipart boundary
  console.log('[uploadFormData]', method, url);
  const res = await fetch(url, { method, body: formData, headers });
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch (_) { data = { error: text }; }
  console.log('[uploadFormData] status:', res.status, 'body:', text.slice(0, 200));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

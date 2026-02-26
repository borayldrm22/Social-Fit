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
  return {
    get: (path) => apiRequest(path, { method: 'GET' }, token),
    post: (path, body) => apiRequest(path, { method: 'POST', body: JSON.stringify(body) }, token),
    patch: (path, body) => apiRequest(path, { method: 'PATCH', body: JSON.stringify(body) }, token),
    delete: (path) => apiRequest(path, { method: 'DELETE' }, token),
  };
}

export async function uploadFormData(path, formData, token) {
  const url = `${API_BASE}${path}`;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', body: formData, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

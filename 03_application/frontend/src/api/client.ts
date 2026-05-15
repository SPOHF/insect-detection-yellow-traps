/**
 * File Purpose: client.ts
 * Inputs: Component props, API payloads, and user interactions where applicable.
 * Outputs: Rendered UI, API calls, and state updates.
 * Process: Implements module-specific frontend behavior.
 * Authorship: Louis Ferger-Andrews (@LouisFerger-Andrews)
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';

async function apiErrorMessage(response: Response): Promise<string> {
  if (response.status >= 500) {
    return 'Server error. Try again later.';
  }
  const contentType = response.headers.get('Content-Type') ?? '';
  const text = await response.text();
  if (contentType.includes('application/json')) {
    try {
      const payload = JSON.parse(text) as { detail?: unknown };
      if (typeof payload.detail === 'string') return payload.detail;
    } catch {
      return text || 'Request failed';
    }
  }
  return text || 'Request failed';
}

async function fetchWithHandling(path: string, init: RequestInit, token: string | undefined, accept: string): Promise<Response> {
  const headers = new Headers(init.headers || {});
  headers.set('Accept', accept);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      referrerPolicy: 'same-origin',
    });
  } catch {
    throw new Error(`Cannot reach API at ${API_BASE}. Ensure backend is running on port 8000.`);
  }

  if (!response.ok) {
    throw new Error(await apiErrorMessage(response));
  }

  return response;
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetchWithHandling(path, { ...init, headers }, token, 'application/json');
  return response.json() as Promise<T>;
}

async function requestText(path: string, init: RequestInit = {}, token?: string): Promise<string> {
  const response = await fetchWithHandling(path, init, token, 'text/csv, text/plain');
  return response.text();
}

async function requestBlob(path: string, init: RequestInit = {}, token?: string): Promise<Blob> {
  const response = await fetchWithHandling(path, init, token, 'image/*, application/octet-stream');
  return response.blob();
}

export const apiClient = {
  get: <T>(path: string, token?: string) => request<T>(path, { method: 'GET' }, token),
  post: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, token),
  patch: <T>(path: string, body: unknown, token?: string) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, token),
  postForm: <T>(path: string, body: FormData, token?: string) =>
    request<T>(path, { method: 'POST', body }, token),
  getText: (path: string, token?: string) => requestText(path, { method: 'GET' }, token),
  getBlob: (path: string, token?: string) => requestBlob(path, { method: 'GET' }, token),
};

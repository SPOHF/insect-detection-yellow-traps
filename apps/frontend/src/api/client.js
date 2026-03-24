const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000';
async function request(path, init = {}, token) {
    const headers = new Headers(init.headers || {});
    if (!(init.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    let response;
    try {
        response = await fetch(`${API_BASE}${path}`, {
            ...init,
            headers,
        });
    }
    catch {
        throw new Error(`Cannot reach API at ${API_BASE}. Ensure backend is running on port 8000.`);
    }
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Request failed');
    }
    return response.json();
}
export const apiClient = {
    get: (path, token) => request(path, { method: 'GET' }, token),
    post: (path, body, token) => request(path, { method: 'POST', body: JSON.stringify(body) }, token),
    patch: (path, body, token) => request(path, { method: 'PATCH', body: JSON.stringify(body) }, token),
    postForm: (path, body, token) => request(path, { method: 'POST', body }, token),
};

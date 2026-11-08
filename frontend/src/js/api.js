const API_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const getToken = () => localStorage.getItem('lds.token');
const getCartToken = () => localStorage.getItem('lds.cartToken');

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const finalHeaders = { Accept: 'application/json', ...headers };
  const token = getToken();
  if (token) finalHeaders.Authorization = `Bearer ${token}`;

  const cartToken = getCartToken();
  if (cartToken) finalHeaders['X-Cart-Token'] = cartToken;

  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!response.ok) {
    const message = payload?.error?.message || `Falha na requisicao (${response.status}).`;
    throw new ApiError(message, response.status, payload?.error?.details);
  }

  return payload;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  baseUrl: API_URL,
};

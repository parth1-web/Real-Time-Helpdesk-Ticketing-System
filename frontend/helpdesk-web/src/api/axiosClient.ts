import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '' });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem('accessToken');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const orig: any = err.config;
    if (err.response?.status === 401 && !orig._retried) {
      orig._retried = true;
      try {
        const rt = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken: rt });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        orig.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(orig);
      } catch { localStorage.clear(); window.location.href = '/login'; }
    }
    return Promise.reject(err);
  }
);
export default api;
export const authApi = {
  login: (email: string, password: string) => api.post('/api/auth/login', { email, password }),
  register: (p: any) => api.post('/api/auth/register', p),
  me: () => api.get('/api/auth/me'),
};
export const ticketApi = {
  list: (params: any) => api.get('/api/tickets', { params }),
  get: (id: string) => api.get(`/api/tickets/${id}`),
  create: (p: any) => api.post('/api/tickets', p),
  messages: (id: string) => api.get(`/api/tickets/${id}/messages`),
  reply: (id: string, p: any) => api.post(`/api/tickets/${id}/messages`, p),
  assign: (id: string, agentId: string) => api.post(`/api/tickets/${id}/assign`, { agentId }),
  summary: () => api.get('/api/reports/summary'),
};

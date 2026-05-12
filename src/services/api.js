import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({ baseURL: BASE, timeout: 10000 });

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('al_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('al_token');
    window.location.href = '/login';
  }
  return Promise.reject(err);
});

export const authApi = {
  register: d => api.post('/auth/register', d),
  login: d => api.post('/auth/login', d),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const unitsApi = {
  list: () => api.get('/units'),
  get: id => api.get(`/units/${id}`),
  create: d => api.post('/units', d),
  update: (id, d) => api.put(`/units/${id}`, d),
  delete: id => api.delete(`/units/${id}`),
  setState: (id, s) => api.put(`/units/${id}/state`, s),
  getQueue: id => api.get(`/units/${id}/queue`),
};

export default api;
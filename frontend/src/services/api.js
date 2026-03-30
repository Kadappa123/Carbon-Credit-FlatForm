import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh });
        localStorage.setItem('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login/', data),
  register: (data) => api.post('/auth/register/', data),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  profile: () => api.get('/auth/profile/'),
  changePassword: (data) => api.post('/auth/change-password/', data),
};

// ── Companies ──────────────────────────────────────────────────────────────────
export const companiesAPI = {
  registerCompany: (data) => api.post('/companies/register/', data),
  getProfile: () => api.get('/companies/profile/'),
  updateProfile: (data) => api.patch('/companies/profile/', data),
  getMarketplace: (params) => api.get('/companies/marketplace/', { params }),
  // Emissions
  submitEmission: (data) => api.post('/companies/emissions/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getEmissions: () => api.get('/companies/emissions/'),
  getEmissionDashboard: () => api.get('/companies/emissions/dashboard/'),
  getEmissionDetail: (id) => api.get(`/companies/emissions/${id}/`),
};

// ── Trading ────────────────────────────────────────────────────────────────────
export const tradingAPI = {
  getMarketplace: () => api.get('/trading/marketplace/'),
  createListing: (data) => api.post('/trading/listings/create/', data),
  cancelListing: (id) => api.delete(`/trading/listings/${id}/cancel/`),
  purchaseCredits: (data) => api.post('/trading/purchase/', data),
  getTransactions: () => api.get('/trading/history/'),
  retireCredits: (data) => api.post('/trading/retire/', data),
  getRetirements: () => api.get('/trading/retirements/'),
};

// ── Government ─────────────────────────────────────────────────────────────────
export const governmentAPI = {
  getDashboard: () => api.get('/government/dashboard/'),
  getSubmissions: (params) => api.get('/government/submissions/', { params }),
  reviewSubmission: (id, data) => api.post(`/government/submissions/${id}/review/`, data),
  reviewKYB: (id, data) => api.post(`/government/companies/${id}/kyb/`, data),
  setEmissionLimit: (id, data) => api.post(`/government/companies/${id}/emission-limit/`, data),
  getFraudAlerts: () => api.get('/government/fraud-alerts/'),
};

// ── Blockchain ─────────────────────────────────────────────────────────────────
export const blockchainAPI = {
  getStatus: () => api.get('/blockchain/status/'),
  createWallet: () => api.post('/blockchain/wallet/create/'),
  getBalance: () => api.get('/blockchain/wallet/balance/'),
};

export default api;

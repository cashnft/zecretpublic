import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to add authorization token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Export API methods
export const apiService = {
  // Auth
  register: (displayName) => api.post('/api/register', { display_name: displayName }),
  login: (accessCode) => api.post('/api/login', { access_code: accessCode }),
  
  // Users
  getOnlineUsers: () => api.get('/api/users/online'),
  getUserPublicKey: (userId) => api.get(`/api/users/${userId}/public-key`),
  updateProfile: (displayName) => api.put('/api/users/profile', { display_name: displayName }),
  
  // Messages
  getMessages: (userId) => api.get(`/api/messages?user_id=${userId}`),
  sendMessage: (message) => api.post('/api/messages', message),
};

export default apiService;
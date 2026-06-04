import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const register = (data) => API.post('/auth/register', data);
export const login    = (data) => API.post('/auth/login', data);
export const getMe    = ()     => API.get('/auth/me');
// Trains
export const searchTrains     = (query) => API.get(`/train?q=${query}`);
export const getTrainDetail   = (number) => API.get(`/train/${number}`);
export const getTrainInstances = (number) => API.get(`/train/${number}/instances`);

// PNR
export const checkPNR = (pnr) => API.get(`/pnr/${pnr}`);

// Posts
export const getPosts    = () => API.get('/posts');
export const createPost  = (data) => API.post('/posts', data);

export default API;
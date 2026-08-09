import api from './axiosInstance';

export function register(payload) {
  return api.post('/auth/register', payload).then((res) => res.data);
}

export function login(payload) {
  return api.post('/auth/login', payload).then((res) => res.data);
}

export function fetchMe() {
  return api.get('/auth/me').then((res) => res.data);
}

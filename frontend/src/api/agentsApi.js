import api from './axiosInstance';

export function fetchAgents() {
  return api.get('/agents').then((res) => res.data);
}

import api from './axiosInstance';

export function fetchTickets(params) {
  return api.get('/tickets', { params }).then((res) => res.data);
}

export function fetchTicketStats() {
  return api.get('/tickets/stats').then((res) => res.data);
}

export function fetchTicketById(id) {
  return api.get(`/tickets/${id}`).then((res) => res.data);
}

export function createTicket(payload) {
  return api.post('/tickets', payload).then((res) => res.data);
}

export function updateTicket(id, payload) {
  return api.patch(`/tickets/${id}`, payload).then((res) => res.data);
}

export function addComment(id, text) {
  return api.post(`/tickets/${id}/comments`, { text }).then((res) => res.data);
}

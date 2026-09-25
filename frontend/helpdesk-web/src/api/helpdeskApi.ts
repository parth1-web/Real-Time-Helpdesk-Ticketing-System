import api from './axiosClient';
import type { Paged, Ticket, TicketMessage, Department, TicketCategory, SlaPolicy, NotificationItem } from '../types';

export const authApi = {
  login: (email: string, password: string) => api.post('/api/auth/login', { email, password }),
  register: (p: { firstName: string; lastName: string; email: string; password: string; organizationSlug?: string }) =>
    api.post('/api/auth/register', { firstName: p.firstName, lastName: p.lastName, email: p.email, password: p.password, organizationSlug: p.organizationSlug ?? null }),
  me: () => api.get('/api/auth/me'),
  logout: (refreshToken: string) => api.post('/api/auth/logout', { refreshToken }),
};
export const ticketApi = {
  list: (params: Record<string, unknown>) => api.get<Paged<Ticket>>('/api/tickets', { params }),
  get: (id: string) => api.get<Ticket>(`/api/tickets/${id}`),
  create: (p: { subject: string; description: string; priority: string; categoryId?: string; departmentId?: string; organizationId: string }) =>
    api.post<Ticket>('/api/tickets', { subject: p.subject, description: p.description, priority: p.priority, categoryId: p.categoryId ?? null, departmentId: p.departmentId ?? null, organizationId: p.organizationId }),
  changeStatus: (id: string, status: string) => api.patch(`/api/tickets/${id}/status`, { status }),
  changePriority: (id: string, priority: string) => api.patch(`/api/tickets/${id}/priority`, { priority }),
};
export const messageApi = {
  list: (ticketId: string) => api.get<TicketMessage[]>(`/api/tickets/${ticketId}/messages`),
  send: (ticketId: string, p: { message: string; isInternal?: boolean }) => api.post(`/api/tickets/${ticketId}/messages`, p),
};
export const organizationApi = { list: () => api.get('/api/organizations') };
export const departmentApi = {
  list: () => api.get<Department[]>('/api/departments'),
  create: (p: Partial<Department>) => api.post('/api/departments', p),
};
export const categoryApi = {
  list: () => api.get<TicketCategory[]>('/api/categories'),
  create: (p: Partial<TicketCategory>) => api.post('/api/categories', p),
};
export const notificationApi = {
  list: () => api.get<NotificationItem[]>('/api/notifications'),
  unreadCount: () => api.get<{ count: number }>('/api/notifications/unread-count'),
  markRead: (id: string) => api.patch(`/api/notifications/${id}/read`, {}),
  markAllRead: () => api.patch('/api/notifications/read-all', {}),
};
export const reportApi = { summary: () => api.get('/api/reports/summary') };
export const feedbackApi = {
  submit: (ticketId: string, rating: number, comment: string) => api.post(`/api/tickets/${ticketId}/feedback`, { rating, comment }),
  get: (ticketId: string) => api.get(`/api/tickets/${ticketId}/feedback`),
};

export type TicketStatus = 'Open' | 'InProgress' | 'WaitingForCustomer' | 'Resolved' | 'Closed';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type UserRole = 'SuperAdmin' | 'OrganizationAdmin' | 'SupportManager' | 'SupportAgent' | 'Customer';
export type SlaStatus = 'OnTrack' | 'AtRisk' | 'Breached';
export interface User { id: string; email: string; fullName: string; role: UserRole; organizationId?: string; }
export interface AuthResponse { userId: string; email: string; fullName: string; accessToken: string; refreshToken: string; expiresAt: string; }
export interface Ticket {
  id: string; ticketNumber: string; subject: string; description?: string;
  status: TicketStatus; priority: TicketPriority;
  categoryId?: string; departmentId?: string; organizationId?: string;
  createdBy?: string; assignedTo?: string;
  createdAt: string; updatedAt?: string; dueAt?: string; slaStatus: SlaStatus;
}
export interface TicketMessage { id: string; ticketId: string; senderId: string; message: string; isInternal: boolean; createdAt: string; }
export interface Department { id: string; organizationId: string; name: string; description?: string; isActive: boolean; }
export interface TicketCategory { id: string; organizationId: string; name: string; description?: string; isActive: boolean; }
export interface SlaPolicy { id: string; organizationId: string; name: string; priority: TicketPriority; firstResponseMinutes: number; resolutionMinutes: number; isActive: boolean; }
export interface NotificationItem { id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string; }
export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number; }
export const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  Open: ['InProgress', 'Closed'],
  InProgress: ['WaitingForCustomer', 'Resolved', 'Open'],
  WaitingForCustomer: ['InProgress', 'Resolved'],
  Resolved: ['Closed', 'InProgress'],
  Closed: ['InProgress'],
};

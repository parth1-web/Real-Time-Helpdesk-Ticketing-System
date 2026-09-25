import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  setSession: (token: string, refresh: string, user: User) => void;
  clear: () => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('accessToken'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  setSession: (token, refresh, user) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('role', user.role);
    set({ token, user });
  },
  clear: () => { localStorage.clear(); set({ token: null, user: null }); },
}));
export const canAssign = (role?: string) =>
  ['SuperAdmin', 'OrganizationAdmin', 'SupportManager', 'SupportAgent'].includes(role ?? '');

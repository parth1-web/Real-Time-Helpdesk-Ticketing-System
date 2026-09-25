import { create } from 'zustand';
import type { User } from '../types';
import { getToken, getStoredUser, saveSession, clearSession } from './session';

interface AuthState {
  token: string | null;
  user: User | null;
  setSession: (token: string, refresh: string, user: User, remember?: boolean) => void;
  clear: () => void;
}
export const useAuthStore = create<AuthState>((set) => ({
  token: getToken(),
  user: getStoredUser() ? JSON.parse(getStoredUser()!) : null,
  setSession: (token, refresh, user, remember = true) => {
    saveSession(token, refresh, JSON.stringify(user), user.role, remember);
    set({ token, user });
  },
  clear: () => { clearSession(); set({ token: null, user: null }); },
}));
export const canAssign = (role?: string) =>
  ['SuperAdmin', 'OrganizationAdmin', 'SupportManager', 'SupportAgent'].includes(role ?? '');

import { create } from 'zustand';
type AuthState = { token: string | null; role: string | null; theme: 'light' | 'dark'; setAuth: (t: string, r: string) => void; clear: () => void; toggleTheme: () => void; };
export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem('accessToken'),
  role: localStorage.getItem('role'),
  theme: (localStorage.getItem('theme') as any) ?? 'light',
  setAuth: (t, r) => { localStorage.setItem('accessToken', t); localStorage.setItem('role', r); set({ token: t, role: r }); },
  clear: () => { localStorage.clear(); set({ token: null, role: null }); },
  toggleTheme: () => set((s) => { const theme = s.theme === 'light' ? 'dark' : 'light'; localStorage.setItem('theme', theme); return { theme }; }),
}));

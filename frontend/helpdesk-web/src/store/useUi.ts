import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';
interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  sidebarOpen: boolean;
  setTheme: (t: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;
}
function applyTheme(t: Theme) {
  const root = document.documentElement;
  const resolved = t === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : t;
  root.setAttribute('data-theme', resolved);
  root.setAttribute('data-bs-theme', resolved);
}
export const useUi = create<UiState>((set) => ({
  theme: (localStorage.getItem('theme') as Theme) ?? 'light',
  sidebarCollapsed: localStorage.getItem('sidebar') === 'collapsed',
  sidebarOpen: false,
  setTheme: (theme) => { localStorage.setItem('theme', theme); applyTheme(theme); set({ theme }); },
  toggleSidebar: () => set((s) => {
    const collapsed = !s.sidebarCollapsed;
    localStorage.setItem('sidebar', collapsed ? 'collapsed' : 'expanded');
    return { sidebarCollapsed: collapsed };
  }),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
}));
export function initTheme() {
  applyTheme((localStorage.getItem('theme') as Theme) ?? 'light');
}

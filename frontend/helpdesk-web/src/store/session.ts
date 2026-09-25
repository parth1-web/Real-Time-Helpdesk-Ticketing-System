// Token storage with "remember me" support.
// Remembered sessions persist in localStorage; session-only in sessionStorage.
export function getToken(): string | null {
  return localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');
}
export function getRefresh(): string | null {
  return localStorage.getItem('refreshToken') ?? sessionStorage.getItem('refreshToken');
}
export function getStoredUser(): string | null {
  return localStorage.getItem('user') ?? sessionStorage.getItem('user');
}
export function saveSession(token: string, refresh: string, userJson: string, role: string, remember: boolean) {
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  other.removeItem('accessToken'); other.removeItem('refreshToken'); other.removeItem('user'); other.removeItem('role');
  store.setItem('accessToken', token);
  store.setItem('refreshToken', refresh);
  store.setItem('user', userJson);
  store.setItem('role', role);
}
export function clearSession() {
  for (const s of [localStorage, sessionStorage]) {
    s.removeItem('accessToken'); s.removeItem('refreshToken'); s.removeItem('user'); s.removeItem('role');
  }
}
export function touchSession(token: string, refresh: string) {
  const store = localStorage.getItem('refreshToken') ? localStorage : sessionStorage;
  store.setItem('accessToken', token);
  store.setItem('refreshToken', refresh);
}

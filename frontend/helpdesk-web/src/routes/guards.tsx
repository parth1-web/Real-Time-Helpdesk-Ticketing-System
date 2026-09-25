import { Navigate, useLocation } from 'react-router-dom';
import { Spinner, Container, Alert } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/helpdeskApi';
import { useAuthStore } from '../store/useAuthStore';
import { getToken } from '../store/session';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
  const token = getToken();
  const loc = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return children;
}
export function RoleRoute({ roles, children }: { roles: string[]; children: JSX.Element }) {
  const { user } = useAuthStore();
  const { isLoading, isError } = useQuery({
    queryKey: ['me'], queryFn: async () => (await authApi.me()).data,
    retry: false, staleTime: 60000,
  });
  if (isLoading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  if (isError) return <Navigate to="/login" replace />;
  if (user && !roles.includes(user.role))
    return <Container className="py-5"><Alert variant="warning"><h4>403</h4><p>You don&apos;t have permission to access this page.</p></Alert></Container>;
  return children;
}

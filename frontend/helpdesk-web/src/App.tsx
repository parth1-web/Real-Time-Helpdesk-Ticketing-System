import { Suspense, lazy, Component, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toast, ToastContainer, Spinner, Container, Alert, Button } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { AppShell } from './layouts/AppShell';
import { ProtectedRoute, RoleRoute } from './routes/guards';
import { LoginPage, RegisterPage } from './pages/auth/AuthPages';
import { CustomerDashboard, TicketListPage, TicketNewPage, TicketDetailPage } from './pages/customer/CustomerPages';
import { AgentDashboard, TicketQueuePage, NotificationsPage } from './pages/agent/AgentPages';
import { AdminDashboard, AdminLists, SlaPage } from './pages/admin/AdminPages';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15000 } } });

class Boundary extends Component<{ children: ReactNode }, { err: string }> {
  state = { err: '' };
  static getDerivedStateFromError(e: unknown) { return { err: String(e) }; }
  render() {
    if (this.state.err) return <Container className="py-5"><Alert variant="danger"><h4>Something went wrong</h4><p>We&apos;ve encountered an unexpected error.</p><Button onClick={() => window.location.reload()}>Reload Application</Button></Alert></Container>;
    return this.props.children;
  }
}
function Toasts() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(true);
    window.addEventListener('helpdesk:toast', h);
    return () => window.removeEventListener('helpdesk:toast', h);
  }, []);
  return <ToastContainer position="bottom-end" className="p-3"><Toast show={show} onClose={() => setShow(false)} autohide><Toast.Body>✓ Saved</Toast.Body></Toast></ToastContainer>;
}
function DetailByParam() { const { id } = useParams(); return id ? <TicketDetailPage id={id} /> : null; }
function NotFound() { return <Container className="py-5 text-center"><h2>404</h2><p>Page not found. The page you&apos;re looking for doesn&apos;t exist.</p><Button href="/dashboard">Back to Dashboard</Button></Container>; }
function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return <ProtectedRoute><AppShell title={title}>{children}</AppShell></ProtectedRoute>;
}
export default function App() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); document.querySelector<HTMLInputElement>('input[aria-label="Global search"]')?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <QueryClientProvider client={qc}>
      <Boundary>
        <Suspense fallback={<Container className="py-5 text-center"><Spinner animation="border" /></Container>}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<div className="p-5 text-center"><h1>Modern support. Faster resolutions.</h1><p>Manage conversations, tickets and SLA from one platform.</p><p><a className="btn btn-primary me-2" href="/login">Get Started</a><a className="btn btn-outline-secondary" href="/dashboard">View Demo</a></p></div>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<Shell title="Dashboard"><CustomerDashboard /></Shell>} />
              <Route path="/tickets" element={<Shell title="Tickets"><TicketListPage /></Shell>} />
              <Route path="/tickets/new" element={<Shell title="New Ticket"><TicketNewPage /></Shell>} />
              <Route path="/tickets/:id" element={<Shell title="Ticket"><DetailByParam /></Shell>} />
              <Route path="/notifications" element={<Shell title="Notifications"><NotificationsPage /></Shell>} />
              <Route path="/profile" element={<Shell title="Profile"><Container fluid>Profile · Theme · Notifications preferences.</Container></Shell>} />
              <Route path="/settings" element={<Shell title="Settings"><Container fluid>Appearance · Account · Security · Organization.</Container></Shell>} />
              <Route path="/agent/dashboard" element={<Shell title="Agent"><RoleRoute roles={['SupportAgent', 'SupportManager', 'OrganizationAdmin', 'SuperAdmin']}><AgentDashboard /></RoleRoute></Shell>} />
              <Route path="/agent/tickets" element={<Shell title="Queue"><RoleRoute roles={['SupportAgent', 'SupportManager', 'OrganizationAdmin', 'SuperAdmin']}><TicketQueuePage /></RoleRoute></Shell>} />
              <Route path="/agent/tickets/:id" element={<Shell title="Ticket"><DetailByParam /></Shell>} />
              <Route path="/admin/dashboard" element={<Shell title="Admin"><RoleRoute roles={['OrganizationAdmin', 'SuperAdmin', 'SupportManager']}><AdminDashboard /></RoleRoute></Shell>} />
              <Route path="/admin/agents" element={<Shell title="Agents"><AdminLists kind="agents" /></Shell>} />
              <Route path="/admin/departments" element={<Shell title="Departments"><AdminLists kind="departments" /></Shell>} />
              <Route path="/admin/categories" element={<Shell title="Categories"><AdminLists kind="categories" /></Shell>} />
              <Route path="/admin/sla" element={<Shell title="SLA"><SlaPage /></Shell>} />
              <Route path="/admin/reports" element={<Shell title="Reports"><AdminDashboard /></Shell>} />
              <Route path="/admin/activity" element={<Shell title="Activity"><Container fluid>Activity timeline from /api reports.</Container></Shell>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toasts />
          </BrowserRouter>
        </Suspense>
      </Boundary>
    </QueryClientProvider>
  );
}
export { lazy };

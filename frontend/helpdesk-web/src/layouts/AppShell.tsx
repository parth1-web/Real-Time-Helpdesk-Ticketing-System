import { useState } from 'react';
import { Container, Navbar, Nav, Offcanvas, Badge, Form, Breadcrumb, Dropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, Sun, Moon, Search, LifeBuoy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../api/helpdeskApi';
import { useAuthStore } from '../store/useAuthStore';
import { useUi } from '../store/useUi';
import { UserAvatar } from '../components/common/ui';

function SidebarLinks({ role, onNav }: { role?: string; onNav?: () => void }) {
  const loc = useLocation();
  const groups: Record<string, { to: string; label: string }[]> = {
    Customer: [
      { to: '/dashboard', label: 'Dashboard' }, { to: '/tickets', label: 'My Tickets' },
      { to: '/tickets/new', label: 'Create Ticket' }, { to: '/notifications', label: 'Notifications' },
    ],
    Agent: [
      { to: '/agent/dashboard', label: 'Dashboard' }, { to: '/agent/tickets', label: 'Ticket Queue' },
      { to: '/dashboard', label: 'My Tickets' }, { to: '/notifications', label: 'Notifications' },
    ],
    Admin: [
      { to: '/admin/dashboard', label: 'Dashboard' }, { to: '/agent/tickets', label: 'Tickets' },
      { to: '/admin/agents', label: 'Agents' }, { to: '/admin/departments', label: 'Departments' },
      { to: '/admin/categories', label: 'Categories' }, { to: '/admin/sla', label: 'SLA Policies' },
      { to: '/admin/reports', label: 'Reports' }, { to: '/admin/activity', label: 'Activity Logs' },
    ],
  };
  const key = role === 'Customer' ? 'Customer' : role === 'SupportAgent' ? 'Agent' : 'Admin';
  return (
    <Nav className="flex-column gap-1">
      {(groups[key] ?? groups.Customer).map((l) => (
        <Nav.Link key={l.to} as={Link} to={l.to} active={loc.pathname === l.to} onClick={onNav}>{l.label}</Nav.Link>
      ))}
    </Nav>
  );
}

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const { user, clear } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, sidebarOpen, setSidebarOpen, theme, setTheme } = useUi();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const { data: unread } = useQuery({ queryKey: ['unread'], queryFn: async () => (await notificationApi.unreadCount()).data, refetchInterval: 30000 });

  return (
    <div className="app-shell d-flex">
      <aside className={`sidebar border-end p-3 d-none d-lg-block ${sidebarCollapsed ? 'collapsed' : ''}`} aria-label="Sidebar">
        <div className="d-flex align-items-center gap-2 mb-3 fw-bold"><LifeBuoy size={22} color="#4f46e5" />{!sidebarCollapsed && 'HelpDesk'}</div>
        <SidebarLinks role={user?.role ?? 'Customer'} />
      </aside>
      <Offcanvas show={sidebarOpen} onHide={() => setSidebarOpen(false)} responsive="lg">
        <Offcanvas.Header closeButton><Offcanvas.Title>HelpDesk</Offcanvas.Title></Offcanvas.Header>
        <Offcanvas.Body><SidebarLinks role={user?.role ?? 'Customer'} onNav={() => setSidebarOpen(false)} /></Offcanvas.Body>
      </Offcanvas>
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        <Navbar bg="light" className="border-bottom px-3" sticky="top">
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary btn-sm d-lg-none" aria-label="Menu" onClick={() => setSidebarOpen(true)}><Menu size={16} /></button>
            <button className="btn btn-outline-secondary btn-sm d-none d-lg-inline" aria-label="Toggle sidebar" onClick={toggleSidebar}>☰</button>
            <Breadcrumb className="mb-0 d-none d-md-flex"><Breadcrumb.Item linkAs={Link} linkProps={{ to: '/dashboard' }}>Dashboard</Breadcrumb.Item><Breadcrumb.Item active>{title}</Breadcrumb.Item></Breadcrumb>
          </div>
          <Form className="d-none d-md-flex mx-3 flex-grow-1" style={{ maxWidth: 420 }} onSubmit={(e) => { e.preventDefault(); nav(`/tickets?search=${encodeURIComponent(q)}`); }}>
            <div className="input-group">
              <span className="input-group-text"><Search size={14} /></span>
              <Form.Control placeholder="Search tickets... (Ctrl+K)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Global search" />
            </div>
          </Form>
          <div className="d-flex align-items-center gap-2 ms-auto">
            <span className="live-dot" title="Live" aria-label="Live" />
            <Link to="/notifications" className="btn btn-outline-secondary btn-sm position-relative" aria-label="Notifications">
              <Bell size={15} />{(unread?.count ?? 0) > 0 && <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle">{unread!.count > 9 ? '9+' : unread!.count}</Badge>}
            </Link>
            <button className="btn btn-outline-secondary btn-sm" aria-label="Theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" size="sm" aria-label="Profile"><UserAvatar name={user?.fullName ?? 'U'} size={24} /></Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Header>{user?.fullName}<br /><small>{user?.email}</small></Dropdown.Header>
                <Dropdown.Item as={Link} to="/profile">Profile</Dropdown.Item>
                <Dropdown.Item as={Link} to="/settings">Settings</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => { clear(); nav('/login'); }}>Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Navbar>
        <Container fluid className="py-3 px-3 px-lg-4">{children}</Container>
      </div>
    </div>
  );
}

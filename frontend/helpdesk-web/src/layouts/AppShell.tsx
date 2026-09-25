import { useState } from 'react';
import { Container, Navbar, Nav, Offcanvas, Badge, Form, Breadcrumb, Dropdown, Modal, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, Bell, Sun, Moon, Search, LifeBuoy, LayoutDashboard, Ticket, BellRing,
  Users, Building2, Tags, Gauge, BarChart3, Activity, Settings, Plus, Command,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../api/helpdeskApi';
import { useAuthStore } from '../store/useAuthStore';
import { useUi } from '../store/useUi';
import { UserAvatar } from '../components/common/ui';

type NavItem = { to: string; label: string; icon: React.ReactNode; badge?: number };
function sections(role?: string): { title: string; items: NavItem[] }[] {
  if (role === 'SupportAgent')
    return [
      { title: 'Overview', items: [{ to: '/agent/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> }] },
      { title: 'Support', items: [{ to: '/agent/tickets', label: 'Ticket Queue', icon: <Ticket size={16} /> }, { to: '/dashboard', label: 'My Tickets', icon: <Ticket size={16} /> }, { to: '/notifications', label: 'Notifications', icon: <BellRing size={16} /> }] },
    ];
  if (role === 'OrganizationAdmin' || role === 'SuperAdmin' || role === 'SupportManager')
    return [
      { title: 'Overview', items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> }] },
      { title: 'Support', items: [{ to: '/agent/tickets', label: 'Tickets', icon: <Ticket size={16} /> }, { to: '/admin/agents', label: 'Agents', icon: <Users size={16} /> }] },
      { title: 'Management', items: [{ to: '/admin/departments', label: 'Departments', icon: <Building2 size={16} /> }, { to: '/admin/categories', label: 'Categories', icon: <Tags size={16} /> }, { to: '/admin/sla', label: 'SLA Policies', icon: <Gauge size={16} /> }, { to: '/admin/reports', label: 'Reports', icon: <BarChart3 size={16} /> }, { to: '/admin/activity', label: 'Activity Logs', icon: <Activity size={16} /> }, { to: '/settings', label: 'Settings', icon: <Settings size={16} /> }] },
    ];
  return [
    { title: 'Overview', items: [{ to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> }] },
    { title: 'Support', items: [{ to: '/tickets', label: 'My Tickets', icon: <Ticket size={16} /> }, { to: '/tickets/new', label: 'Create Ticket', icon: <Plus size={16} /> }, { to: '/notifications', label: 'Notifications', icon: <BellRing size={16} /> }] },
  ];
}

function SidebarLinks({ role, collapsed, onNav, unread }: { role?: string; collapsed?: boolean; onNav?: () => void; unread?: number }) {
  const loc = useLocation();
  return (
    <div>
      {sections(role).map((s) => (
        <div key={s.title} className="mb-2">
          {!collapsed && <small className="text-secondary text-uppercase px-2">{s.title}</small>}
          <Nav className="flex-column gap-1 mt-1">
            {s.items.map((l) => (
              <Nav.Link key={l.to} as={Link} to={l.to} active={loc.pathname === l.to} onClick={onNav} title={collapsed ? l.label : undefined} className="d-flex align-items-center gap-2">
                {l.icon}{!collapsed && <span>{l.label}</span>}
                {!collapsed && l.label === 'Notifications' && (unread ?? 0) > 0 && <Badge bg="danger" pill className="ms-auto">{unread! > 9 ? '9+' : unread}</Badge>}
              </Nav.Link>
            ))}
          </Nav>
        </div>
      ))}
    </div>
  );
}

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const { user, clear } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, sidebarOpen, setSidebarOpen, theme, setTheme } = useUi();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [palette, setPalette] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const { data: unread } = useQuery({ queryKey: ['unread'], queryFn: async () => (await notificationApi.unreadCount()).data, refetchInterval: 30000 });
  useState(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  });
  const go = (to: string) => { setPalette(false); nav(to); };

  return (
    <div className="app-shell d-flex">
      <aside className={`sidebar border-end p-3 d-none d-lg-flex flex-column ${sidebarCollapsed ? 'collapsed' : ''}`} aria-label="Sidebar">
        <div className="d-flex align-items-center gap-2 mb-1 fw-bold"><LifeBuoy size={22} color="#4f46e5" />{!sidebarCollapsed && 'HelpDesk'}</div>
        {!sidebarCollapsed && <button className="btn btn-sm btn-outline-secondary mb-3 text-start" onClick={() => setPalette(true)} title="Command palette (Ctrl+K)"><span className="d-flex align-items-center gap-2"><Search size={13} /> Search or command… <kbd>Ctrl K</kbd></span></button>}
        <div className="flex-grow-1"><SidebarLinks role={user?.role ?? 'Customer'} collapsed={sidebarCollapsed} unread={unread?.count} /></div>
        <div className="border-top pt-2 d-flex align-items-center gap-2">
          <UserAvatar name={user?.fullName ?? 'U'} size={30} />
          {!sidebarCollapsed && <div className="small"><div className="fw-semibold">{user?.fullName}</div><div className="text-secondary">{user?.role}</div></div>}
        </div>
        {!sidebarCollapsed && <button className="btn btn-sm btn-outline-secondary mt-2" onClick={toggleSidebar} aria-label="Collapse sidebar">⇤ Collapse</button>}
      </aside>
      <Offcanvas show={sidebarOpen} onHide={() => setSidebarOpen(false)} responsive="lg">
        <Offcanvas.Header closeButton><Offcanvas.Title>HelpDesk</Offcanvas.Title></Offcanvas.Header>
        <Offcanvas.Body><SidebarLinks role={user?.role ?? 'Customer'} onNav={() => setSidebarOpen(false)} unread={unread?.count} /></Offcanvas.Body>
      </Offcanvas>
      <div className="flex-grow-1" style={{ minWidth: 0 }}>
        {!online && <div className="offline-bar text-center py-1">You&apos;re offline — we&apos;ll reconnect automatically.</div>}
        <Navbar className="border-bottom px-3" sticky="top" style={{ background: 'var(--surface)' }}>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-secondary btn-sm d-lg-none mobile-offcanvas-btn" aria-label="Menu" onClick={() => setSidebarOpen(true)}><Menu size={16} /></button>
            <button className="btn btn-outline-secondary btn-sm d-none d-lg-inline" aria-label="Toggle sidebar" onClick={toggleSidebar}>☰</button>
            <Breadcrumb className="mb-0 d-none d-md-flex"><Breadcrumb.Item linkAs={Link} linkProps={{ to: '/dashboard' }}>Dashboard</Breadcrumb.Item><Breadcrumb.Item active>{title}</Breadcrumb.Item></Breadcrumb>
          </div>
          <Form className="d-none d-md-flex mx-3 flex-grow-1" style={{ maxWidth: 420 }} onSubmit={(e) => { e.preventDefault(); nav(`/tickets?search=${encodeURIComponent(q)}`); }}>
            <div className="input-group">
              <span className="input-group-text"><Search size={14} /></span>
              <Form.Control placeholder="Search tickets...  Ctrl K" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Global search" onFocus={() => undefined} />
            </div>
          </Form>
          <div className="d-flex align-items-center gap-2 ms-auto">
            <span className="live-dot" title="Live" aria-label="Live" />
            <Link to="/notifications" className="btn btn-outline-secondary btn-sm position-relative" aria-label="Notifications">
              <Bell size={15} />{(unread?.count ?? 0) > 0 && <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle">{unread!.count > 9 ? '9+' : unread!.count}</Badge>}
            </Link>
            <button className="btn btn-outline-secondary btn-sm" aria-label="Theme" title="Light / Dark" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" size="sm" aria-label="Profile"><UserAvatar name={user?.fullName ?? 'U'} size={24} /></Dropdown.Toggle>
              <Dropdown.Menu align="end">
                <Dropdown.Header>{user?.fullName}<br /><small className="text-secondary">{user?.role} · {user?.email}</small></Dropdown.Header>
                <Dropdown.Item as={Link} to="/profile">Profile</Dropdown.Item>
                <Dropdown.Item as={Link} to="/settings">Preferences & Settings</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => { clear(); nav('/login'); }}>Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </Navbar>
        <Container fluid className="py-3 px-3 px-lg-4"><div className="app-main">{children}</div></Container>
      </div>
      <Modal show={palette} onHide={() => setPalette(false)} centered size="sm" aria-label="Command palette">
        <Modal.Header closeButton><Modal.Title className="d-flex gap-2 align-items-center"><Command size={16} /> Quick actions</Modal.Title></Modal.Header>
        <Modal.Body className="d-grid gap-2">
          <Button variant="outline-secondary" onClick={() => go('/tickets/new')}>+ Create ticket</Button>
          <Button variant="outline-secondary" onClick={() => go('/dashboard')}>Open dashboard</Button>
          <Button variant="outline-secondary" onClick={() => go('/notifications')}>Open notifications</Button>
          <Button variant="outline-secondary" onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setPalette(false); }}>Toggle dark mode</Button>
          <Button variant="outline-secondary" onClick={() => go('/settings')}>Open settings</Button>
        </Modal.Body>
      </Modal>
    </div>
  );
}

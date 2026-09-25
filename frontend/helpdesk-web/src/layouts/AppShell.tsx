import { useEffect, useMemo, useState } from 'react';
import { Container, Navbar, Nav, Offcanvas, Badge, Breadcrumb, Dropdown, Modal, Button, ListGroup, Spinner } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, Bell, Sun, Moon, Search, LifeBuoy, LayoutDashboard, Ticket, BellRing,
  Users, Building2, Tags, Gauge, BarChart3, Activity, Settings, Plus, Command,
  Wifi, WifiOff, Loader, CircleHelp, LogOut,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi, ticketApi } from '../api/helpdeskApi';
import { useAuthStore } from '../store/useAuthStore';
import { useUi } from '../store/useUi';
import { UserAvatar } from '../components/common/ui';
import { useLive } from '../realtime/RealtimeProvider';

type Item = { to?: string; label: string; icon: React.ReactNode; action?: 'logout' };
const GENERAL: Item[] = [
  { to: '/settings', label: 'Settings', icon: <Settings size={17} /> },
  { to: '/tickets/new', label: 'Help', icon: <CircleHelp size={17} /> },
  { label: 'Logout', icon: <LogOut size={17} />, action: 'logout' },
];
function sections(role?: string): { title: string; items: Item[] }[] {
  if (role === 'SupportAgent')
    return [
      { title: 'Overview', items: [{ to: '/agent/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> }] },
      { title: 'Support', items: [{ to: '/agent/tickets', label: 'Ticket Queue', icon: <Ticket size={17} /> }, { to: '/dashboard', label: 'My Tickets', icon: <Ticket size={17} /> }, { to: '/notifications', label: 'Notifications', icon: <BellRing size={17} /> }] },
      { title: 'General', items: GENERAL },
    ];
  if (role === 'OrganizationAdmin' || role === 'SuperAdmin' || role === 'SupportManager')
    return [
      { title: 'Overview', items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> }] },
      { title: 'Support', items: [{ to: '/agent/tickets', label: 'Tickets', icon: <Ticket size={17} /> }, { to: '/admin/agents', label: 'Agents', icon: <Users size={17} /> }, { to: '/notifications', label: 'Notifications', icon: <BellRing size={17} /> }] },
      { title: 'Management', items: [{ to: '/admin/departments', label: 'Departments', icon: <Building2 size={17} /> }, { to: '/admin/categories', label: 'Categories', icon: <Tags size={17} /> }, { to: '/admin/sla', label: 'SLA Policies', icon: <Gauge size={17} /> }, { to: '/admin/reports', label: 'Reports', icon: <BarChart3 size={17} /> }, { to: '/admin/activity', label: 'Activity Logs', icon: <Activity size={17} /> }] },
      { title: 'General', items: GENERAL },
    ];
  return [
    { title: 'Overview', items: [{ to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> }] },
    { title: 'Support', items: [{ to: '/tickets', label: 'My Tickets', icon: <Ticket size={17} /> }, { to: '/tickets/new', label: 'Create Ticket', icon: <Plus size={17} /> }, { to: '/notifications', label: 'Notifications', icon: <BellRing size={17} /> }] },
    { title: 'General', items: GENERAL },
  ];
}

function SidebarBody({ collapsed, onNav, unread }: { collapsed?: boolean; onNav?: () => void; unread?: number }) {
  const loc = useLocation();
  const nav = useNavigate();
  const { user, clear } = useAuthStore();
  const doLogout = () => { clear(); onNav?.(); nav('/login'); };
  return (
    <div className="d-flex flex-column h-100">
      <Link to="/dashboard" className="brand-row" onClick={onNav}>
        <span className="brand-badge"><LifeBuoy size={20} /></span>
        {!collapsed && <span className="brand-name">HelpDesk</span>}
      </Link>
      {!collapsed && (
        <div className="workspace-card" title={user?.email}>
          <span className="workspace-dot" />
          <span className="text-truncate">{user?.organizationId ? 'Workspace' : 'My Workspace'}</span>
        </div>
      )}
      <div className="flex-grow-1 overflow-auto mt-1">
        {sections(user?.role).map((s) => (
          <div key={s.title} className="mb-2">
            {!collapsed && <div className="side-section">{s.title}</div>}
            <Nav className="flex-column gap-1">
              {s.items.map((l) => {
                if (l.action === 'logout')
                  return (
                    <Nav.Link key={l.label} onClick={doLogout} title={collapsed ? l.label : undefined} className="side-link">
                      {l.icon}{!collapsed && <span>{l.label}</span>}
                    </Nav.Link>
                  );
                const active = loc.pathname === l.to;
                return (
                  <Nav.Link key={l.to} as={Link} to={l.to!} active={active} onClick={onNav} title={collapsed ? l.label : undefined} className="side-link">
                    {l.icon}{!collapsed && <span>{l.label}</span>}
                    {!collapsed && l.label === 'Notifications' && (unread ?? 0) > 0 && <Badge bg="danger" pill className="ms-auto">{unread! > 9 ? '9+' : unread}</Badge>}
                  </Nav.Link>
                );
              })}
            </Nav>
          </div>
        ))}
      </div>
      {!collapsed && (
        <div className="promo-card mb-2">
          <strong>{(unread ?? 0) > 0 ? `${unread} unread update${unread === 1 ? '' : 's'}` : 'All caught up'}</strong>
          <div className="mb-2" style={{ opacity: 0.75 }}>Realtime sync is on.</div>
          <Button size="sm" variant="light" className="w-100" onClick={() => { onNav?.(); nav('/notifications'); }}>View updates</Button>
        </div>
      )}
      <div className="side-user">
        <UserAvatar name={user?.fullName ?? 'U'} size={32} />
        {!collapsed && <div className="text-truncate small"><div className="fw-semibold text-truncate">{user?.fullName}</div><div className="text-secondary text-truncate">{user?.role}</div></div>}
      </div>
    </div>
  );
}

function LivePill() {
  const live = useLive();
  if (live === 'live') return <span className="live-pill live" title="Realtime connected"><span className="live-dot" /> Live</span>;
  if (live === 'connecting') return <span className="live-pill connecting" title="Reconnecting"><Loader size={12} className="spin" /> Reconnecting…</span>;
  return <span className="live-pill offline" title="Offline"><WifiOff size={12} /> Offline</span>;
}

function Palette({ show, close }: { show: boolean; close: () => void }) {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [deb, setDeb] = useState('');
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setDeb(q), 250);
    return () => clearTimeout(t);
  }, [q, show]);
  const { data, isFetching } = useQuery({
    queryKey: ['palette', deb], queryFn: async () => (await ticketApi.list({ search: deb, page: 1, pageSize: 6 })).data,
    enabled: show && deb.trim().length > 1,
  });
  const go = (to: string) => { close(); setQ(''); nav(to); qc.invalidateQueries({ queryKey: ['tickets'] }); };
  return (
    <Modal show={show} onHide={close} centered size="lg" aria-label="Search and commands" className="palette">
      <Modal.Body>
        <div className="palette-input"><Search size={16} /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tickets or type a command…" aria-label="Palette search" onKeyDown={(e) => { if (e.key === 'Enter' && deb) go(`/tickets?search=${encodeURIComponent(deb)}`); }} /><kbd>esc</kbd></div>
        <div className="palette-actions">
          <Button size="sm" variant="outline-secondary" onClick={() => go('/tickets/new')}>+ New ticket</Button>
          <Button size="sm" variant="outline-secondary" onClick={() => go('/dashboard')}>Dashboard</Button>
          <Button size="sm" variant="outline-secondary" onClick={() => go('/notifications')}>Notifications</Button>
          <Button size="sm" variant="outline-secondary" onClick={() => go('/settings')}>Settings</Button>
        </div>
        {isFetching && <div className="p-2"><Spinner size="sm" animation="border" /> Searching…</div>}
        {(data?.items ?? []).length > 0 && (
          <ListGroup variant="flush">
            {(data?.items ?? []).map((t) => (
              <ListGroup.Item key={t.id} action onClick={() => go(`/tickets/${t.id}`)}>
                <strong>{t.ticketNumber}</strong> <span className="text-secondary">· {t.status} · {t.priority}</span><br />{t.subject}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
        {deb.trim().length > 1 && !isFetching && (data?.items ?? []).length === 0 && <div className="p-3 text-secondary">No matching tickets — try a different keyword.</div>}
      </Modal.Body>
    </Modal>
  );
}

export function AppShell({ children, title }: { children: React.ReactNode; title: string }) {
  const { user, clear } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, sidebarOpen, setSidebarOpen, theme, setTheme } = useUi();
  const nav = useNavigate();
  const [palette, setPalette] = useState(false);
  const { data: unread } = useQuery({ queryKey: ['unread'], queryFn: async () => (await notificationApi.unreadCount()).data, refetchInterval: 30000 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`} aria-label="Primary">
        <SidebarBody collapsed={sidebarCollapsed} unread={unread?.count} />
        <button className="collapse-btn" onClick={toggleSidebar} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{sidebarCollapsed ? '⇥' : '⇤ Collapse'}</button>
      </aside>
      {/* Mobile drawer only — never rendered alongside the desktop aside */}
      <Offcanvas show={sidebarOpen} onHide={() => setSidebarOpen(false)} className="d-lg-none" placement="start">
        <Offcanvas.Header closeButton><Offcanvas.Title><LifeBuoy size={18} /> HelpDesk</Offcanvas.Title></Offcanvas.Header>
        <Offcanvas.Body><SidebarBody onNav={() => setSidebarOpen(false)} unread={unread?.count} /></Offcanvas.Body>
      </Offcanvas>
      <div className="shell-main">
        <header className="topbar">
          <button className="btn btn-outline-secondary btn-sm d-lg-none" aria-label="Open menu" onClick={() => setSidebarOpen(true)}><Menu size={16} /></button>
          <Link to="/dashboard" className="brand-row d-lg-none"><span className="brand-badge sm"><LifeBuoy size={16} /></span></Link>
          <Breadcrumb className="crumbs d-none d-md-flex"><Breadcrumb.Item linkAs={Link} linkProps={{ to: '/dashboard' }}>Home</Breadcrumb.Item><Breadcrumb.Item active>{title}</Breadcrumb.Item></Breadcrumb>
          <button className="search-pill" onClick={() => setPalette(true)} aria-label="Search (Ctrl+K)"><Search size={14} /><span>Search tickets…</span><kbd>Ctrl K</kbd></button>
          <div className="top-actions">
            <LivePill />
            <Link to="/notifications" className="btn btn-outline-secondary btn-sm icon-btn position-relative" aria-label="Notifications">
              <Bell size={15} />{(unread?.count ?? 0) > 0 && <Badge bg="danger" pill className="pos-badge">{unread!.count > 9 ? '9+' : unread!.count}</Badge>}
            </Link>
            <button className="btn btn-outline-secondary btn-sm icon-btn" aria-label="Toggle theme" title="Light / Dark" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}</button>
            <Dropdown>
              <Dropdown.Toggle variant="light" size="sm" className="profile-toggle" aria-label="Account">
                <UserAvatar name={user?.fullName ?? 'U'} size={30} />
                <span className="d-none d-xl-block text-start profile-meta"><strong>{user?.fullName}</strong><small className="text-secondary">{user?.email}</small></span>
              </Dropdown.Toggle>
              <Dropdown.Menu align="end" className="profile-menu">
                <Dropdown.Header><strong>{user?.fullName}</strong><br /><small className="text-secondary">{user?.role}</small><br /><small className="text-secondary">{user?.email}</small></Dropdown.Header>
                <Dropdown.Item as={Link} to="/profile">Profile</Dropdown.Item>
                <Dropdown.Item as={Link} to="/settings">Preferences & settings</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => { clear(); nav('/login'); }}>Log out</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </header>
        <main className="app-main"><Container fluid className="px-3 px-lg-4 py-3">{children}</Container></main>
      </div>
      <Palette show={palette} close={() => setPalette(false)} />
      <span className="d-none"><Command size={1} /><Wifi size={1} /></span>
    </div>
  );
}

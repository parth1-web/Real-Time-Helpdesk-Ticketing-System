import { Card, Row, Col, Table, Badge, Button, Form, Container, Spinner } from 'react-bootstrap';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Bell } from 'lucide-react';
import { ticketApi, reportApi, departmentApi } from '../../api/helpdeskApi';
import { PageHeader, EmptyState, ErrorState, SkeletonCards, StatCard } from '../../components/common/ui';
import { FilterChip } from '../../components/common/ui';

export function AgentDashboard() {
  const { data } = useQuery({ queryKey: ['summary'], queryFn: async () => (await reportApi.summary()).data, refetchInterval: 30000 });
  const urgent = data?.byPriority?.find((x: { priority: string }) => x.priority === 'Urgent')?.count ?? 0;
  return (<div>
    <PageHeader title="Good morning 👋" desc="Plan, prioritize, and resolve the queue with ease." actions={<span className="d-flex gap-2"><Link to="/agent/tickets" className="btn btn-primary">Open Queue</Link><Link to="/tickets/new" className="btn btn-outline-secondary">+ New Ticket</Link></span>} />
    <Row className="g-3 stat-grid">
      <Col xs={12} sm={6} lg={3}><StatCard dark label="My Open Tickets" value={data?.open ?? 0} sub="Needs attention first" /></Col>
      <Col xs={12} sm={6} lg={3}><StatCard label="Urgent" value={urgent} sub="Highest priority" /></Col>
      <Col xs={12} sm={6} lg={3}><StatCard label="SLA Breached" value={data?.breached ?? 0} sub="Missed deadlines" /></Col>
      <Col xs={12} sm={6} lg={3}><StatCard label="Resolved" value={data?.resolved ?? 0} sub={`CSAT ${Number(data?.avgRating ?? 0).toFixed(1)}`} /></Col>
    </Row>
  </div>);
}

export function TicketQueuePage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['queue', search, status], queryFn: async () => (await ticketApi.list({ search: search || undefined, status: status || undefined, page: 1, pageSize: 20 })).data, refetchInterval: 30000 });
  const { data: depts } = useQuery({ queryKey: ['depts'], queryFn: async () => (await departmentApi.list()).data });
  if (isLoading) return <SkeletonCards />;
  if (isError) return <ErrorState message="Unable to load queue." onRetry={() => refetch()} />;
  const items = data?.items ?? [];
  return (
    <div>
      <PageHeader title="Ticket Queue" desc="Professional support workspace." />
      <div className="d-flex gap-2 mb-2 flex-wrap align-items-center">
        <Form.Control placeholder="Search number, subject..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 260 }} aria-label="Search queue" />
        <Form.Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 160 }} aria-label="Status"><option value="">Status</option><option>Open</option><option>InProgress</option><option>WaitingForCustomer</option><option>Resolved</option></Form.Select>
        <Form.Select style={{ maxWidth: 180 }} aria-label="Department"><option>Department</option>{(depts ?? []).map((d) => <option key={d.id}>{d.name}</option>)}</Form.Select>
      </div>
      <div className="mb-3 d-flex gap-1 flex-wrap align-items-center">
        {search && <FilterChip label={`Search: ${search}`} onClear={() => setSearch('')} />}
        {status && <FilterChip label={`Status: ${status}`} onClear={() => setStatus('')} />}
        {(search || status) && <Button variant="link" size="sm" onClick={() => { setSearch(''); setStatus(''); }}>Clear all</Button>}
      </div>
      {items.length === 0 ? <EmptyState title="No tickets match these filters" desc={status === 'Resolved' ? 'No resolved tickets yet.' : 'Your queue is clear.'} action={<Button variant="outline-secondary" onClick={() => setStatus('Resolved')}>View Resolved Tickets</Button>} />
        : <><Table striped hover responsive className="desktop-table"><thead><tr><th>Ticket</th><th>Subject</th><th>Priority</th><th>Status</th><th>SLA</th><th>Updated</th></tr></thead><tbody>{items.map((t) => (<tr key={t.id} style={t.priority === 'Urgent' ? { borderLeft: '3px solid var(--danger)' } : undefined}><td><Link to={`/agent/tickets/${t.id}`}>{t.ticketNumber}</Link></td><td>{t.subject}</td><td><Badge bg={t.priority === 'Urgent' ? 'danger' : 'warning'}>{t.priority === 'Urgent' ? '⚡ Urgent' : t.priority}</Badge></td><td><Badge bg="info">{t.status}</Badge></td><td>{t.slaStatus}</td><td>{new Date(t.createdAt).toLocaleString()}</td></tr>))}</tbody></Table>
          <div className="mobile-cards">{items.map((t) => (<Link key={t.id} to={`/agent/tickets/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}><Card className="mb-2 p-3 ticket-card"><strong>{t.ticketNumber}</strong><div className="fw-semibold">{t.subject}</div><div className="d-flex gap-2 mt-1"><Badge bg={t.priority === 'Urgent' ? 'danger' : 'warning'}>{t.priority}</Badge><Badge bg="info">{t.status}</Badge></div><small className="text-secondary">Updated {new Date(t.createdAt).toLocaleString()}</small></Card></Link>))}</div>
          <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2"><small className="text-secondary">Showing 1–{items.length} of {data?.total ?? 0}</small><small className="text-secondary d-lg-none">‹ Previous&nbsp;&nbsp;1 / {Math.max(1, Math.ceil((data?.total ?? 0) / 20))}&nbsp;&nbsp;Next ›</small></div></>}
    </div>
  );
}

export function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifs'], queryFn: async () => (await import('../../api/helpdeskApi')).notificationApi.list().then((r) => r.data), refetchInterval: 30000 });
  const { data: unread } = useQuery({ queryKey: ['unread'], queryFn: async () => (await import('../../api/helpdeskApi')).notificationApi.unreadCount().then((r) => r.data), refetchInterval: 30000 });
  const markAll = async () => { await import('../../api/helpdeskApi').then((m) => m.notificationApi.markAllRead()); qc.invalidateQueries({ queryKey: ['notifs'] }); qc.invalidateQueries({ queryKey: ['notifs', 'preview'] }); qc.invalidateQueries({ queryKey: ['unread'] }); };
  if (isLoading) return <Container className="py-4"><Spinner animation="border" aria-label="Loading notifications" /></Container>;
  const items = data ?? [];
  const count = unread?.count ?? items.filter((n) => !n.isRead).length;
  return (
    <Container fluid>
      <PageHeader title="Notifications" desc="Real-time updates from tickets and SLA." actions={<Button size="sm" variant="outline-secondary" onClick={markAll}>Mark all as read</Button>} />
      <Card className="p-3 mb-3 health-card">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div><strong>{count > 0 ? `${count} unread update${count === 1 ? '' : 's'}` : 'All caught up'}</strong><br /><small style={{ opacity: 0.75 }}>Realtime sync is on.</small></div>
          <span className="live-pill live"><span className="live-dot" /> Live</span>
        </div>
      </Card>
      {items.length === 0
        ? <EmptyState icon={<Bell size={32} className="mx-auto mb-2 text-secondary" />} title="You're all caught up" desc="No notifications right now." />
        : items.map((n) => (
          <Card key={n.id} className="mb-2 p-3" style={!n.isRead ? { background: 'var(--surface-secondary)' } : undefined}>
            <div className="d-flex gap-2 align-items-start"><span aria-hidden>{!n.isRead ? '● ' : ''}</span><div><strong>{n.title}</strong><div className="text-secondary small">{n.message} · {new Date(n.createdAt).toLocaleString()}</div></div>
              {!n.isRead && <Button size="sm" variant="link" className="ms-auto" onClick={async () => { await import('../../api/helpdeskApi').then((m) => m.notificationApi.markRead(n.id)); qc.invalidateQueries({ queryKey: ['notifs'] }); qc.invalidateQueries({ queryKey: ['notifs', 'preview'] }); qc.invalidateQueries({ queryKey: ['unread'] }); }}>Mark read</Button>}</div>
          </Card>))}
    </Container>
  );
}

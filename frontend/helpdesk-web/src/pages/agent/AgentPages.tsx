import { Card, Row, Col, Table, Badge, Button, Form, Container, Spinner, Alert } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ticketApi, reportApi, departmentApi } from '../../api/helpdeskApi';
import { TicketCard, FilterChip, SkeletonTable } from '../../components/common/ui';

export function AgentDashboard() {
  const { data } = useQuery({ queryKey: ['summary'], queryFn: async () => (await reportApi.summary()).data });
  const stats = [
    ['My Open Tickets', data?.open ?? 0], ['Urgent', data?.byPriority?.find((x: { priority: string }) => x.priority === 'Urgent')?.count ?? 0],
    ['SLA At Risk', 0], ['SLA Breached', data?.breached ?? 0], ['Resolved', data?.resolved ?? 0], ['Total', data?.total ?? 0],
  ];
  return (<div><PageHeader title="Good morning 👋" desc="Here's your support overview." /><Row className="g-3">{stats.map(([l, v]) => (<Col key={l as string} xs={12} sm={6} lg={2}><Card className="p-3 metric-card text-center"><div className="fs-3 fw-bold">{v as number}</div><div className="text-secondary">{l as string}</div></Card></Col>))}</Row></div>);
}

export function TicketQueuePage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['queue', search, status], queryFn: async () => (await ticketApi.list({ search: search || undefined, status: status || undefined, page: 1, pageSize: 20 })).data });
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
      {items.length === 0 ? <EmptyState title="No unassigned tickets" desc="Your queue is clear." action={<Button variant="outline-secondary" onClick={() => { setSearch(''); setStatus(''); }}>View Resolved Tickets</Button>} />
        : <><Table striped hover responsive className="desktop-table"><thead><tr><th>Ticket</th><th>Subject</th><th>Priority</th><th>Status</th><th>SLA</th><th>Updated</th></tr></thead><tbody>{items.map((t) => (<tr key={t.id} style={t.priority === 'Urgent' ? { borderLeft: '3px solid var(--danger)' } : undefined}><td><Link to={`/agent/tickets/${t.id}`}>{t.ticketNumber}</Link></td><td>{t.subject}</td><td><Badge bg={t.priority === 'Urgent' ? 'danger' : 'warning'}>{t.priority === 'Urgent' ? '⚡ Urgent' : t.priority}</Badge></td><td><Badge bg="info">{t.status}</Badge></td><td>{t.slaStatus}</td><td>{new Date(t.createdAt).toLocaleString()}</td></tr>))}</tbody></Table>
          <div className="mobile-cards">{items.map((t) => (<Link key={t.id} to={`/agent/tickets/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}><Card className="mb-2 p-3 ticket-card"><strong>{t.ticketNumber}</strong><div className="fw-semibold">{t.subject}</div><div className="d-flex gap-2 mt-1"><Badge bg={t.priority === 'Urgent' ? 'danger' : 'warning'}>{t.priority}</Badge><Badge bg="info">{t.status}</Badge></div><small className="text-secondary">Updated {new Date(t.createdAt).toLocaleString()}</small></Card></Link>))}</div>
          <div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2"><small className="text-secondary">Showing 1–{items.length} of {data?.total ?? 0}</small><small className="text-secondary d-lg-none">‹ Previous&nbsp;&nbsp;1 / {Math.max(1, Math.ceil((data?.total ?? 0) / 20))}&nbsp;&nbsp;Next ›</small></div></>}
    </div>
  );
}

export function NotificationsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['notifs'], queryFn: async () => (await import('../../api/helpdeskApi')).notificationApi.list().then((r) => r.data) });
  if (isLoading) return <Container className="py-4"><Spinner animation="border" /></Container>;
  const items = data ?? [];
  if (!items.length) return <Container className="py-4"><Alert variant="info">No notifications. You&apos;re all caught up.</Alert></Container>;
  return (<Container fluid><PageHeader title="Notifications" actions={<Button size="sm" variant="outline-secondary" onClick={() => import('../../api/helpdeskApi').then((m) => m.notificationApi.markAllRead())}>Mark all as read</Button>} />{items.map((n) => (<Card key={n.id} className="mb-2 p-3"><div>{!n.isRead && '● '} <strong>{n.title}</strong></div><div className="text-secondary">{n.message} · {new Date(n.createdAt).toLocaleString()}</div></Card>))}</Container>);
}

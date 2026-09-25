import { useState } from 'react';
import { Card, Button, Row, Col, Form, Table, Badge } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ticketApi, categoryApi, departmentApi, messageApi, feedbackApi } from '../../api/helpdeskApi';
import { PageHeader, EmptyState, ErrorState, SkeletonCards, StatusBadge, PriorityBadge, SlaBadge, UserAvatar } from '../../components/common/ui';
import { useAuthStore } from '../../store/useAuthStore';
import { createTicketConnection } from '../../api/signalr';
import { useEffect } from 'react';

export function CustomerDashboard() {
  const { user } = useAuthStore();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['tickets', 'mine'], queryFn: async () => (await ticketApi.list({ page: 1, pageSize: 20 })).data });
  const items = data?.items ?? [];
  const open = items.filter((t) => t.status === 'Open').length;
  if (isLoading) return <div><PageHeader title={`Good morning, ${user?.fullName ?? 'there'} 👋`} desc="How can we help you today?" /><SkeletonCards /></div>;
  if (isError) return <ErrorState message="We couldn't load your tickets." onRetry={() => refetch()} />;
  return (
    <div>
      <PageHeader title={`Good morning, ${user?.fullName ?? 'there'} 👋`} desc="How can we help you today?" actions={<Link to="/tickets/new" className="btn btn-primary"><Plus size={15} /> Create New Ticket</Link>} />
      <Row className="g-3 mb-3">
        {[['Open Tickets', open], ['Total Tickets', data?.total ?? 0], ['Resolved', items.filter((t) => t.status === 'Resolved').length], ['Waiting', items.filter((t) => t.status === 'WaitingForCustomer').length]].map(([l, v]) => (
          <Col key={l as string} xs={12} sm={6} lg={3}><Card className="p-3 metric-card"><div className="fs-3 fw-bold">{v as number}</div><div className="text-secondary">{l as string}</div></Card></Col>
        ))}
      </Row>
      {items.length === 0
        ? <EmptyState title="No support tickets yet." desc="Need help with something?" action={<Link to="/tickets/new" className="btn btn-primary">Create Your First Ticket</Link>} />
        : <Card className="p-0 overflow-hidden"><Table hover responsive className="mb-0"><thead><tr><th>Ticket</th><th>Subject</th><th>Status</th><th>Priority</th><th>Updated</th></tr></thead><tbody>{items.slice(0, 8).map((t) => (<tr key={t.id}><td><Link to={`/tickets/${t.id}`}>{t.ticketNumber}</Link></td><td>{t.subject}</td><td><StatusBadge s={t.status} /></td><td><PriorityBadge p={t.priority} /></td><td>{new Date(t.createdAt).toLocaleString()}</td></tr>))}</tbody></Table></Card>}
    </div>
  );
}

export function TicketListPage() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') ?? '';
  const status = params.get('status') ?? '';
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['tickets', search, status], queryFn: async () => (await ticketApi.list({ search: search || undefined, status: status || undefined, page: 1, pageSize: 20 })).data });
  const items = data?.items ?? [];
  if (isLoading) return <SkeletonCards />;
  if (isError) return <ErrorState message="Unable to load tickets." onRetry={() => refetch()} />;
  return (
    <div>
      <PageHeader title="My Tickets" desc="Track and manage your support requests." actions={<Link to="/tickets/new" className="btn btn-primary">+ New Ticket</Link>} />
      <Form className="d-flex gap-2 mb-3 flex-wrap">
        <Form.Control placeholder="Search tickets..." value={search} onChange={(e) => setParams({ search: e.target.value, status })} style={{ maxWidth: 280 }} aria-label="Search tickets" />
        <Form.Select value={status} onChange={(e) => setParams({ search, status: e.target.value })} style={{ maxWidth: 170 }} aria-label="Status filter">
          <option value="">Status</option><option>Open</option><option>InProgress</option><option>WaitingForCustomer</option><option>Resolved</option><option>Closed</option>
        </Form.Select>
        {(search || status) && <Button variant="outline-secondary" onClick={() => setParams({})}>Clear Filters</Button>}
      </Form>
      {items.length === 0 ? <EmptyState title="No tickets found." desc="You don't have any tickets matching the current filters." action={<Button variant="outline-secondary" onClick={() => setParams({})}>Clear Filters</Button>} />
        : <div>{items.map((t) => (<Link key={t.id} to={`/tickets/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}><Card className="mb-2 p-3 ticket-card"><div className="d-flex gap-2 align-items-center"><strong>{t.ticketNumber}</strong><PriorityBadge p={t.priority} /><StatusBadge s={t.status} /><SlaBadge sla={t.slaStatus} dueAt={t.dueAt} /></div><div className="fw-semibold mt-1">{t.subject}</div><small className="text-secondary">Updated {new Date(t.createdAt).toLocaleString()}</small></Card></Link>))}<p className="text-secondary">Showing 1–{items.length} of {data?.total ?? 0} tickets</p></div>}
    </div>
  );
}

export function TicketNewPage() {
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const { data: cats } = useQuery({ queryKey: ['cats'], queryFn: async () => (await categoryApi.list()).data });
  const { data: depts } = useQuery({ queryKey: ['depts'], queryFn: async () => (await departmentApi.list()).data });
  const [form, setForm] = useState({ subject: '', description: '', priority: 'Medium', categoryId: '', departmentId: '' });
  const { user } = useAuthStore();
  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader title="Create Support Ticket" />
      {err && <div className="alert alert-danger">{err}</div>}
      <Card className="p-3">
        <Form onSubmit={async (e) => {
          e.preventDefault(); setErr('');
          if (!form.subject || !form.description) { setErr('Subject and description are required.'); return; }
          try {
            const { data } = await ticketApi.create({ ...form, categoryId: form.categoryId || undefined, departmentId: form.departmentId || undefined, organizationId: user?.organizationId ?? '00000000-0000-0000-0000-000000000000' });
            nav(`/tickets/${data.id}`);
          } catch { setErr('Unable to create ticket. Check organization and try again.'); }
        }}>
          <Form.Group className="mb-2"><Form.Label>Subject ({form.subject.length}/200)</Form.Label><Form.Control value={form.subject} maxLength={200} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Form.Group>
          <Row><Col><Form.Group className="mb-2"><Form.Label>Category</Form.Label><Form.Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Select category</option>{(cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Form.Select></Form.Group></Col>
            <Col><Form.Group className="mb-2"><Form.Label>Priority</Form.Label><Form.Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></Form.Select></Form.Group></Col></Row>
          <Form.Group className="mb-2"><Form.Label>Description ({form.description.length}/5000)</Form.Label><Form.Control as="textarea" rows={5} value={form.description} maxLength={5000} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Form.Group>
          <div className="d-flex gap-2"><Button variant="outline-secondary" onClick={() => nav(-1)}>Cancel</Button><Button type="submit">Submit Ticket</Button></div>
        </Form>
      </Card>
    </div>
  );
}

export function TicketDetailPage({ id }: { id: string }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { data: ticket } = useQuery({ queryKey: ['ticket', id], queryFn: async () => (await ticketApi.get(id)).data });
  const { data: msgs, isLoading, isError, refetch } = useQuery({ queryKey: ['msgs', id], queryFn: async () => (await messageApi.list(id)).data });
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  useEffect(() => {
    const token = localStorage.getItem('accessToken') ?? '';
    const conn = createTicketConnection(token);
    conn.start().then(() => { conn.invoke('JoinTicket', id).catch(() => undefined); }).catch(() => undefined);
    conn.on('TicketMessageAdded', () => qc.invalidateQueries({ queryKey: ['msgs', id] }));
    conn.on('TicketStatusChanged', () => { qc.invalidateQueries({ queryKey: ['ticket', id] }); qc.invalidateQueries({ queryKey: ['msgs', id] }); });
    return () => { conn.stop().catch(() => undefined); };
  }, [id, qc]);
  const send = async (isInternal: boolean) => {
    if (!text.trim()) return;
    await messageApi.send(id, { message: text, isInternal });
    setText(''); qc.invalidateQueries({ queryKey: ['msgs', id] });
  };
  return (
    <div>
      <PageHeader title={`${ticket?.ticketNumber ?? 'TCK'} — ${ticket?.subject ?? ''}`} desc={ticket ? `Created ${new Date(ticket.createdAt).toLocaleString()}` : ''} actions={ticket && <span className="d-flex gap-2"><StatusBadge s={ticket.status} /><PriorityBadge p={ticket.priority} /></span>} />
      <Row>
        <Col lg={8}>
          <h6>Conversation <span className="live-dot ms-1" title="Live" /> <small className="text-secondary">Live</small></h6>
          {isLoading && <p><span className="skeleton d-block p-4">Loading messages...</span></p>}
          {isError && <ErrorState message="Couldn't load messages." onRetry={() => refetch()} />}
          {(msgs ?? []).map((m) => (
            <Card key={m.id} className={`mb-2 p-2 conversation-bubble ${m.isInternal ? 'internal-note' : ''}`}>
              <div className="d-flex gap-2 align-items-center"><UserAvatar name={m.senderId.slice(0, 4)} size={28} /><small className="text-secondary">{new Date(m.createdAt).toLocaleString()}</small>{m.isInternal && <Badge bg="warning">🔒 Internal Note</Badge>}</div>
              <div className="mt-1">{m.message}</div>
            </Card>
          ))}
          <Card className="p-2 mt-3">
            <Form.Control as="textarea" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your reply... (Ctrl+Enter to send)" aria-label="Reply" onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(false); }} />
            <div className="d-flex gap-2 mt-2"><Button onClick={() => send(false)}>Send →</Button><Button variant="outline-secondary">📎 Attach</Button></div>
          </Card>
          {ticket && (ticket.status === 'Resolved' || ticket.status === 'Closed') && (
            <Card className="p-3 mt-3 text-center"><h6>How was your support experience?</h6>
              <div role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((r) => <Button key={r} variant={r <= rating ? 'warning' : 'outline-secondary'} size="sm" className="me-1" onClick={() => setRating(r)} aria-label={`${r} stars`}>☆</Button>)}</div>
              <Button className="mt-2" size="sm" onClick={() => feedbackApi.submit(id, rating, 'Great support!')}>Submit Feedback</Button></Card>
          )}
        </Col>
        <Col lg={4}>
          <Card className="p-3"><h6>Ticket information</h6><p className="mb-1">Status: {ticket && <StatusBadge s={ticket.status} />}</p><p className="mb-1">Priority: {ticket && <PriorityBadge p={ticket.priority} />}</p><p className="mb-1">SLA: {ticket && <SlaBadge sla={ticket.slaStatus} dueAt={ticket.dueAt} />}</p><p className="mb-0 text-secondary">Department / Agent / Activity update in real time.</p></Card>
        </Col>
      </Row>
    </div>
  );
}

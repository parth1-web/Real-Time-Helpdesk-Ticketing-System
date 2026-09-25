import { useState, useRef } from 'react';
import { Card, Button, Row, Col, Form, Table, Badge, Modal, Dropdown, Alert, Spinner } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { ticketApi, categoryApi, departmentApi, messageApi, feedbackApi, assignmentApi, attachmentApi, activityApi } from '../../api/helpdeskApi';
import { Ticket as TicketIcon, Clock, CheckCircle2, Inbox, ArrowRight, Headset } from 'lucide-react';
import { PageHeader, EmptyState, ErrorState, SkeletonCards, SkeletonTable, SkeletonMessage, StatusBadge, PriorityBadge, SlaBadge, UserAvatar, StatCard, ConfirmModal } from '../../components/common/ui';
import { useAuthStore, canAssign } from '../../store/useAuthStore';
import { getToken } from '../../store/session';
import { VALID_TRANSITIONS } from '../../types';
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
      <PageHeader title={`Good morning, ${user?.fullName ?? 'there'} 👋`} desc="We're here to help." actions={<Link to="/tickets/new" className="btn btn-primary"><Plus size={15} /> Create New Ticket</Link>} />
      <Row className="g-3 mb-3 stat-grid">
        <Col xs={12} sm={6} lg={3}><StatCard icon={<TicketIcon size={18} className="text-secondary" />} label="Open Tickets" value={open} trend="Needs attention first" /></Col>
        <Col xs={12} sm={6} lg={3}><StatCard icon={<Clock size={18} className="text-secondary" />} label="Waiting for Reply" value={items.filter((t) => t.status === 'WaitingForCustomer').length} /></Col>
        <Col xs={12} sm={6} lg={3}><StatCard icon={<CheckCircle2 size={18} className="text-secondary" />} label="Resolved" value={items.filter((t) => t.status === 'Resolved').length} /></Col>
        <Col xs={12} sm={6} lg={3}><StatCard icon={<Inbox size={18} className="text-secondary" />} label="Total Tickets" value={data?.total ?? 0} /></Col>
      </Row>
      <h6 className="mt-1 mb-2">Recent Tickets</h6>
      {items.length === 0
        ? <EmptyState title="No support tickets yet." desc="Need help with something?" action={<Link to="/tickets/new" className="btn btn-primary">Create Your First Ticket</Link>} />
        : <><Card className="p-0 overflow-hidden"><Table hover responsive className="mb-0"><thead><tr><th>Ticket</th><th>Subject</th><th>Status</th><th>Priority</th><th>Updated</th></tr></thead><tbody>{items.slice(0, 8).map((t) => (<tr key={t.id}><td><Link to={`/tickets/${t.id}`}>{t.ticketNumber}</Link></td><td>{t.subject}</td><td><StatusBadge s={t.status} /></td><td><PriorityBadge p={t.priority} /></td><td>{new Date(t.createdAt).toLocaleString()}</td></tr>))}</tbody></Table></Card>
          <h6 className="mt-3 mb-2">Quick Actions</h6>
          <Row className="g-3">
            <Col xs={12} md={4}><Link to="/tickets/new" style={{ textDecoration: 'none' }}><Card className="p-3 interactive-card"><div className="fw-semibold">Create Ticket <ArrowRight size={14} /></div><small className="text-secondary">Get help from our support team.</small></Card></Link></Col>
            <Col xs={12} md={4}><Link to="/tickets" style={{ textDecoration: 'none' }}><Card className="p-3 interactive-card"><div className="fw-semibold">View Tickets <ArrowRight size={14} /></div><small className="text-secondary">Track your existing requests.</small></Card></Link></Col>
            <Col xs={12} md={4}><Card className="p-3"><div className="fw-semibold d-flex gap-2 align-items-center"><Headset size={15} /> Contact Support</div><small className="text-secondary">Need additional assistance?</small></Card></Col>
          </Row></>}
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
      <PageHeader title="Create Support Ticket" desc="Simple steps — admin fields stay hidden." />
      {err && <div className="alert alert-danger" role="alert">{err}</div>}
      <Card className="p-3">
        <h6>1 · Ticket information</h6>
        <Form onSubmit={async (e) => {
          e.preventDefault(); setErr('');
          if (!form.subject || !form.description) { setErr('Subject and description are required.'); return; }
          try {
            const { data } = await ticketApi.create({ ...form, categoryId: form.categoryId || undefined, departmentId: form.departmentId || undefined, organizationId: user?.organizationId ?? '00000000-0000-0000-0000-000000000000' });
            nav(`/tickets/${data.id}`);
          } catch { setErr('Unable to create ticket. Check organization and try again.'); }
        }}>
          <Form.Group className="mb-2"><Form.Label>Subject ({form.subject.length}/200)</Form.Label><Form.Control value={form.subject} maxLength={200} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Unable to access my account" aria-describedby="subject-help" /><Form.Text id="subject-help">We&apos;ll use this subject to identify your request.</Form.Text></Form.Group>
          <Row><Col><Form.Group className="mb-2"><Form.Label>Category</Form.Label><Form.Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">Select category</option>{(cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Form.Select></Form.Group></Col>
            <Col><Form.Group className="mb-2"><Form.Label>Priority</Form.Label><Form.Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></Form.Select></Form.Group></Col></Row>
          <h6 className="mt-3">2 · Description</h6>
          <Form.Group className="mb-2"><Form.Label>Description ({form.description.length}/5000)</Form.Label><Form.Control as="textarea" rows={5} value={form.description} maxLength={5000} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what happened, steps to reproduce…" /></Form.Group>
          <h6 className="mt-3">3 · Attachments</h6>
          <Form.Text>PNG, JPG, PDF up to 10 MB. Validation also runs on the server.</Form.Text>
          <div className="d-flex gap-2 mt-2"><Button variant="outline-secondary" onClick={() => nav(-1)}>Cancel</Button><Button type="submit">4 · Submit Ticket</Button></div>
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
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [fbMsg, setFbMsg] = useState('');
  const [fbErr, setFbErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [flashId, setFlashId] = useState('');
  const [showStatus, setShowStatus] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [agentId, setAgentId] = useState('');
  const [actionErr, setActionErr] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const staff = canAssign(user?.role);
  const { data: existingFb } = useQuery({ queryKey: ['feedback', id], queryFn: async () => (await feedbackApi.get(id)).data.catch(() => null), enabled: ticket?.status === 'Resolved' || ticket?.status === 'Closed' });
  const { data: attachments, refetch: refetchAtts } = useQuery({ queryKey: ['attachments', id], queryFn: async () => (await attachmentApi.list(id)).data });
  const { data: activity } = useQuery({ queryKey: ['activity', id], queryFn: async () => (await activityApi.forTicket(id)).data.catch(() => []) });
  useEffect(() => {
    const token = getToken() ?? '';
    const conn = createTicketConnection(token);
    conn.start().then(() => { conn.invoke('JoinTicket', id).catch(() => undefined); }).catch(() => undefined);
    conn.on('TicketMessageAdded', () => { qc.invalidateQueries({ queryKey: ['msgs', id] }); setFlashId('latest'); setTimeout(() => setFlashId(''), 1600); });
    conn.on('TicketStatusChanged', () => { qc.invalidateQueries({ queryKey: ['ticket', id] }); qc.invalidateQueries({ queryKey: ['msgs', id] }); });
    return () => { conn.stop().catch(() => undefined); };
  }, [id, qc]);
  const send = async (internal: boolean) => {
    if (!text.trim() || sending) return;
    setSending(true); setSendErr('');
    try {
      await messageApi.send(id, { message: text, isInternal: internal && staff });
      setText(''); setIsInternal(false);
      qc.invalidateQueries({ queryKey: ['msgs', id] });
    } catch { setSendErr('Unable to send message. Please try again.'); }
    finally { setSending(false); }
  };
  const doStatus = async () => {
    if (!newStatus) return;
    setActionBusy(true); setActionErr('');
    try {
      await ticketApi.changeStatus(id, newStatus);
      setShowStatus(false);
      qc.invalidateQueries({ queryKey: ['ticket', id] }); qc.invalidateQueries({ queryKey: ['activity', id] });
    } catch (e: unknown) { setActionErr(e instanceof Error ? e.message : 'Status change failed (invalid transition?).'); }
    finally { setActionBusy(false); }
  };
  const doPriority = async () => {
    if (!newPriority) return;
    setActionBusy(true); setActionErr('');
    try {
      await ticketApi.changePriority(id, newPriority);
      setShowPriority(false);
      qc.invalidateQueries({ queryKey: ['ticket', id] });
    } catch { setActionErr('Priority change failed.'); }
    finally { setActionBusy(false); }
  };
  const doAssign = async () => {
    if (!agentId) return;
    setActionBusy(true); setActionErr('');
    try {
      await assignmentApi.assign(id, agentId);
      setShowAssign(false); setAgentId('');
      qc.invalidateQueries({ queryKey: ['ticket', id] }); qc.invalidateQueries({ queryKey: ['activity', id] });
    } catch { setActionErr('Assignment failed.'); }
    finally { setActionBusy(false); }
  };
  const doUpload = async (f: File) => {
    setUploading(true); setUploadErr('');
    try {
      await attachmentApi.upload(id, f);
      refetchAtts();
    } catch { setUploadErr('Upload failed. PNG, JPG, PDF up to 10 MB.'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  };
  const submitFeedback = async () => {
    setFbMsg(''); setFbErr('');
    try {
      await feedbackApi.submit(id, rating, comment);
      setFbMsg('✓ Thank you for your feedback.');
      qc.invalidateQueries({ queryKey: ['feedback', id] });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setFbErr(msg ?? 'Unable to submit feedback.');
    }
  };
  return (
    <div>
      <PageHeader title={`${ticket?.ticketNumber ?? 'TCK'} — ${ticket?.subject ?? ''}`} desc={ticket ? `Created ${new Date(ticket.createdAt).toLocaleString()}` : ''} actions={ticket && <span className="d-flex gap-2 align-items-center flex-wrap"><StatusBadge s={ticket.status} /><PriorityBadge p={ticket.priority} /><Button size="sm" variant="outline-secondary" title="Copy ticket number" onClick={() => { navigator.clipboard?.writeText(ticket.ticketNumber).catch(() => undefined); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>{ticket.ticketNumber} 📋</Button>{copied && <small className="text-success">Copied!</small>}
        <Dropdown>
          <Dropdown.Toggle size="sm" variant="outline-secondary" aria-label="Ticket actions">Actions</Dropdown.Toggle>
          <Dropdown.Menu align="end">
            <Dropdown.Header>Change status</Dropdown.Header>
            {(VALID_TRANSITIONS[ticket.status] ?? []).map((s) => <Dropdown.Item key={s} onClick={() => { setNewStatus(s); setShowStatus(true); }}>{s}</Dropdown.Item>)}
            {staff && <><Dropdown.Divider /><Dropdown.Item onClick={() => { setNewPriority(ticket.priority); setShowPriority(true); }}>Change priority…</Dropdown.Item>
            <Dropdown.Item onClick={() => setShowAssign(true)}>Assign agent…</Dropdown.Item></>}
          </Dropdown.Menu>
        </Dropdown></span>} />
      <Row>
        <Col lg={8}>
          <h6>Conversation <span className="live-dot ms-1" title="Live" aria-label="Connected" /> <small className="text-secondary">Live</small></h6>
          {isLoading && <div><div className="skeleton p-4 mb-2">Loading…</div><div className="skeleton p-4 mb-2">Loading…</div></div>}
          {isError && <ErrorState message="Couldn't load messages." onRetry={() => refetch()} />}
          {(msgs ?? []).map((m, i, arr) => {
            const mine = m.senderId === user?.id;
            return (
              <Card key={m.id} className={`mb-2 p-2 conversation-bubble msg-enter ${m.isInternal ? 'internal-note' : mine ? '' : 'agent'} ${flashId && i === arr.length - 1 ? 'msg-flash' : ''}`}>
                <div className="d-flex gap-2 align-items-center">
                  <UserAvatar name={m.isInternal ? 'Staff' : m.senderId.slice(0, 4)} size={28} />
                  <strong className="small">{m.isInternal ? 'Support staff' : mine ? 'You' : 'Support Agent'}</strong>
                  <small className="text-secondary">{new Date(m.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
                  {m.isInternal && <Badge bg="warning">🔒 Internal Note · staff only</Badge>}
                </div>
                <div className="mt-1">{m.message}</div>
              </Card>
            );
          })}
          <Card className="p-2 mt-3 composer-sticky">
            <Form.Control as="textarea" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply... (Ctrl+Enter to send)" aria-label="Reply" aria-describedby="composer-hint" onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(isInternal); }} />
            <small id="composer-hint" className="text-secondary">Ctrl+Enter to send · {text.length}/5000</small>
            {sendErr && <Alert variant="danger" className="mt-2 py-1">{sendErr}</Alert>}
            <div className="d-flex gap-2 mt-2 composer-actions align-items-center flex-wrap">
              <Button onClick={() => send(isInternal)} disabled={sending || !text.trim()}>{sending ? 'Sending…' : 'Send →'}</Button>
              <Button variant="outline-secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading…' : '📎 Attach'}</Button>
              <input ref={fileRef} type="file" className="d-none" aria-label="Attach file" onChange={(e) => { const f = e.target.files?.[0]; if (f) doUpload(f); }} />
              {staff && <Form.Check type="switch" label="Internal note" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} aria-label="Send as internal note" />}
            </div>
            {uploadErr && <Alert variant="danger" className="mt-2 py-1">{uploadErr}</Alert>}
          </Card>
          {(attachments ?? []).length > 0 && (
            <Card className="p-2 mt-2"><h6>Attachments</h6>{(attachments ?? []).map((a: { id: string; fileName: string; fileSize: number }) => (
              <div key={a.id} className="d-flex justify-content-between align-items-center small"><span>📎 {a.fileName} ({Math.round(a.fileSize / 1024)} KB)</span><Button size="sm" variant="link" onClick={() => attachmentApi.download(id, a.id, a.fileName)}>Download</Button></div>))}</Card>
          )}
          {ticket && (ticket.status === 'Resolved' || ticket.status === 'Closed') && (
            <Card className="p-3 mt-3 text-center"><h6>How satisfied are you?</h6>
              {existingFb ? <Alert variant="success">✓ Thank you — you rated this ticket {(existingFb as { rating?: number }).rating ?? rating}/5.</Alert> : <>
                <div role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((r) => <Button key={r} variant={r <= rating ? 'warning' : 'outline-secondary'} size="sm" className="me-1" onClick={() => setRating(r)} aria-label={`${r} stars`}>☆</Button>)}</div>
                <Form.Control className="mt-2" placeholder="Tell us more (optional)" value={comment} onChange={(e) => setComment(e.target.value)} aria-label="Feedback comment" />
                {fbErr && <Alert variant="danger" className="mt-2 py-1">{fbErr}</Alert>}
                {fbMsg && <Alert variant="success" className="mt-2 py-1">{fbMsg}</Alert>}
                <Button className="mt-2" size="sm" onClick={submitFeedback}>Submit Feedback</Button></>}
            </Card>
          )}
        </Col>
        <Col lg={4}>
          <Card className="p-3 mb-2"><h6>Ticket Details</h6><p className="mb-1">Status: {ticket && <StatusBadge s={ticket.status} />}</p><p className="mb-1">Priority: {ticket && <PriorityBadge p={ticket.priority} />}</p><p className="mb-1">SLA: {ticket && <SlaBadge sla={ticket.slaStatus} dueAt={ticket.dueAt} />}</p><p className="mb-0 text-secondary">Department / Assigned agent update in real time.</p></Card>
          <Card className="p-3"><h6>Activity</h6><div className="timeline">{((activity ?? []) as { id?: string; action?: string; createdAt?: string; description?: string }[]).length === 0 ? <><div className="timeline-item"><strong>Ticket created</strong><br /><small className="text-secondary">{ticket ? new Date(ticket.createdAt).toLocaleString() : ''}</small></div><div className="timeline-item"><strong>Conversation updated</strong><br /><small className="text-secondary">{(msgs ?? []).length} messages</small></div></> : ((activity ?? []) as { id?: string; action?: string; createdAt?: string }[]).slice(0, 12).map((a, i) => <div key={a.id ?? i} className="timeline-item"><strong>{a.action}</strong><br /><small className="text-secondary">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</small></div>)}</div></Card>
        </Col>
      </Row>
      <Modal show={showStatus} onHide={() => setShowStatus(false)} centered>
        <Modal.Header closeButton><Modal.Title>Change status to {newStatus}?</Modal.Title></Modal.Header>
        <Modal.Body>Ticket {ticket?.ticketNumber} will move from {ticket?.status} to {newStatus}. This is logged and notified in real time.</Modal.Body>
        <Modal.Footer>{actionErr && <small className="text-danger me-auto">{actionErr}</small>}<Button variant="outline-secondary" onClick={() => setShowStatus(false)}>Cancel</Button><Button onClick={doStatus} disabled={actionBusy}>{actionBusy ? 'Saving…' : 'Confirm'}</Button></Modal.Footer>
      </Modal>
      <Modal show={showPriority} onHide={() => setShowPriority(false)} centered>
        <Modal.Header closeButton><Modal.Title>Change priority</Modal.Title></Modal.Header>
        <Modal.Body><Form.Select value={newPriority} onChange={(e) => setNewPriority(e.target.value)} aria-label="Priority">{['Low', 'Medium', 'High', 'Urgent'].map((p) => <option key={p}>{p}</option>)}</Form.Select>{actionErr && <small className="text-danger">{actionErr}</small>}</Modal.Body>
        <Modal.Footer><Button variant="outline-secondary" onClick={() => setShowPriority(false)}>Cancel</Button><Button onClick={doPriority} disabled={actionBusy}>{actionBusy ? 'Saving…' : 'Save'}</Button></Modal.Footer>
      </Modal>
      <Modal show={showAssign} onHide={() => setShowAssign(false)} centered>
        <Modal.Header closeButton><Modal.Title>Assign ticket</Modal.Title></Modal.Header>
        <Modal.Body><Form.Group><Form.Label>Agent user ID</Form.Label><Form.Control value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="Paste agent GUID" aria-describedby="assign-help" /><Form.Text id="assign-help">Assignment history is preserved and the agent is notified.</Form.Text></Form.Group>{actionErr && <small className="text-danger">{actionErr}</small>}</Modal.Body>
        <Modal.Footer><Button variant="outline-secondary" onClick={() => setShowAssign(false)}>Cancel</Button><Button onClick={doAssign} disabled={actionBusy || !agentId}>{actionBusy ? 'Assigning…' : 'Assign'}</Button></Modal.Footer>
      </Modal>
    </div>
  );
}

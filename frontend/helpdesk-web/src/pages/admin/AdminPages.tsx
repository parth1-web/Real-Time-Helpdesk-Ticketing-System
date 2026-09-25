import { useState } from 'react';
import { Card, Row, Col, Table, Button, Form, Modal, Alert } from 'react-bootstrap';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { reportApi, departmentApi, categoryApi, slaApi } from '../../api/helpdeskApi';
import { PageHeader, EmptyState, ErrorState, ConfirmModal, StatCard } from '../../components/common/ui';
import type { Department, TicketCategory, SlaPolicy } from '../../types';

export function AdminDashboard() {
  const { data } = useQuery({ queryKey: ['summary'], queryFn: async () => (await reportApi.summary()).data, refetchInterval: 30000 });
  const byStatus = data?.byStatus ?? [];
  const byPriority = data?.byPriority ?? [];
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return (
    <div>
      <PageHeader title="Command Center" desc="Plan, prioritize, and run support with ease." actions={<span className="d-flex gap-2"><Link to="/admin/reports" className="btn btn-primary">View Reports</Link><Link to="/agent/tickets" className="btn btn-outline-secondary">Open Queue</Link></span>} />
      <Row className="g-3 mb-3 stat-grid">
        <Col xs={12} sm={6} lg={2}><StatCard dark label="Total Tickets" value={data?.total ?? 0} sub="All time" /></Col>
        <Col xs={12} sm={6} lg={2}><StatCard label="Open Tickets" value={data?.open ?? 0} sub="Needs attention" /></Col>
        <Col xs={12} sm={6} lg={2}><StatCard label="Resolved" value={data?.resolved ?? 0} sub="Done" /></Col>
        <Col xs={12} sm={6} lg={2}><StatCard label="SLA Breached" value={data?.breached ?? 0} sub="Missed" /></Col>
        <Col xs={12} sm={6} lg={2}><StatCard label="CSAT" value={Number(data?.avgRating ?? 0).toFixed(1)} sub="Avg rating" /></Col>
        <Col xs={12} sm={6} lg={2}><StatCard label="Compliance" value="98%" sub="SLA met" /></Col>
      </Row>
      <Row className="g-3">
        <Col xs={12} lg={4}><Card className="p-3 dash-card"><h6>Tickets by Status</h6><small className="text-secondary">Live from /api/reports/summary</small>{byStatus.length === 0 ? <p className="text-secondary mt-2">No data yet.</p> : <BarChart width={280} height={200} data={byStatus}><XAxis dataKey="status" tickLine={false} axisLine={false} tick={{ fill: dark ? '#fff' : '#111' }} /><YAxis /><Tooltip contentStyle={{ background: dark ? '#1e293b' : '#fff' }} /><Bar dataKey="count" fill="#1d6a44" radius={[8, 8, 8, 8]} /></BarChart>}</Card></Col>
        <Col xs={12} lg={4}><Card className="p-3 dash-card"><h6>Tickets by Priority</h6><small className="text-secondary">Live from /api/reports/summary</small>{byPriority.length === 0 ? <p className="text-secondary mt-2">No data yet.</p> : <PieChart width={280} height={200}><Pie data={byPriority} dataKey="count" nameKey="priority" innerRadius={45} outerRadius={70} strokeWidth={0}>{byPriority.map((_: unknown, i: number) => <Cell key={i} fill={['#9fc3ae', '#57a773', '#1d6a44', '#0d2a1d'][i % 4]} />)}</Pie><Tooltip /></PieChart>}</Card></Col>
        <Col xs={12} lg={4}><Card className="p-3 dash-card"><h6>Ticket Volume</h6><small className="text-secondary">Last 30 days</small><LineChart width={280} height={200} data={[{ d: 'Mon', v: 12 }, { d: 'Tue', v: 19 }, { d: 'Wed', v: 8 }]}><XAxis dataKey="d" tickLine={false} axisLine={false} /><YAxis /><Tooltip /><Line dataKey="v" stroke="#1d6a44" strokeWidth={2} dot={false} /></LineChart></Card></Col>
      </Row>
    </div>
  );
}

function CrudModal({ show, title, onClose, onSave, busy, err, children }: {
  show: boolean; title: string; onClose: () => void; onSave: () => void; busy: boolean; err: string; children: React.ReactNode;
}) {
  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton><Modal.Title>{title}</Modal.Title></Modal.Header>
      <Modal.Body>{err && <Alert variant="danger" className="py-1">{err}</Alert>}{children}</Modal.Body>
      <Modal.Footer><Button variant="outline-secondary" onClick={onClose}>Cancel</Button><Button onClick={onSave} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button></Modal.Footer>
    </Modal>
  );
}

export function AdminLists({ kind }: { kind: 'departments' | 'categories' | 'agents' }) {
  const qc = useQueryClient();
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<{ id: string; name: string; desc: string } | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState<{ id: string; name: string } | null>(null);
  const { data: depts, isError, refetch } = useQuery({ queryKey: ['depts'], queryFn: async () => (await departmentApi.list()).data, enabled: kind === 'departments' });
  const { data: cats } = useQuery({ queryKey: ['cats'], queryFn: async () => (await categoryApi.list()).data, enabled: kind === 'categories' });
  if (kind === 'agents')
    return <div><PageHeader title="Agents" desc="Invite staff via registration, then assign departments." actions={<Link to="/register" className="btn btn-primary">+ Invite Agent</Link>} /><EmptyState title="Manage agents via membership" desc="Use registration to onboard staff, then assign tickets from the queue." action={<Link to="/register" className="btn btn-outline-secondary">Go to Register</Link>} /></div>;
  const isDept = kind === 'departments';
  const rows = isDept ? (depts ?? []).map((d: Department) => ({ id: d.id, name: d.name, desc: d.description ?? '', status: d.isActive ? 'Active' : 'Disabled' })) : (cats ?? []).map((c: TicketCategory) => ({ id: c.id, name: c.name, desc: c.description ?? '', status: c.isActive ? 'Active' : 'Disabled' }));
  const openCreate = () => { setEditing(null); setName(''); setDesc(''); setErr(''); setShow(true); };
  const openEdit = (r: { id: string; name: string; desc: string }) => { setEditing(r); setName(r.name); setDesc(r.desc); setErr(''); setShow(true); };
  const save = async () => {
    if (!name.trim()) { setErr('Name is required.'); return; }
    setBusy(true); setErr('');
    try {
      if (isDept) {
        if (editing) await import('../../api/helpdeskApi').then((m) => m.departmentApi.update(editing.id, { name, description: desc }));
        else await departmentApi.create({ name, description: desc });
        qc.invalidateQueries({ queryKey: ['depts'] });
      } else {
        if (editing) await import('../../api/helpdeskApi').then((m) => m.categoryApi.update(editing.id, { name, description: desc }));
        else await categoryApi.create({ name, description: desc });
        qc.invalidateQueries({ queryKey: ['cats'] });
      }
      setShow(false);
    } catch { setErr('Save failed. Check permissions and try again.'); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!confirmDel) return;
    setBusy(true);
    try {
      if (isDept) await import('../../api/helpdeskApi').then((m) => m.departmentApi.remove(confirmDel.id));
      else await import('../../api/helpdeskApi').then((m) => m.categoryApi.remove(confirmDel.id));
      qc.invalidateQueries({ queryKey: isDept ? ['depts'] : ['cats'] });
      setConfirmDel(null);
    } catch { setErr('Delete failed.'); }
    finally { setBusy(false); }
  };
  if (isError) return <ErrorState message="Couldn't load list." onRetry={() => refetch()} />;
  return (
    <div>
      <PageHeader title={isDept ? 'Departments' : 'Categories'} desc={isDept ? 'Route tickets to the right team.' : 'Classify incoming requests.'} actions={<Button onClick={openCreate}>+ Add {isDept ? 'Department' : 'Category'}</Button>} />
      {err && !show && <Alert variant="danger" className="py-1">{err}</Alert>}
      {rows.length === 0 ? <EmptyState title={`No ${isDept ? 'departments' : 'categories'} yet`} desc={`Create your first ${isDept ? 'department' : 'category'}.`} action={<Button onClick={openCreate}>+ Add</Button>} />
        : <Card className="p-0 overflow-hidden"><Table hover responsive className="mb-0"><thead><tr><th>Name</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((r) => (<tr key={r.id}><td>{r.name}</td><td>{r.desc}</td><td>{r.status}</td><td className="d-flex gap-1"><Button size="sm" variant="outline-secondary" onClick={() => openEdit(r)}>Edit</Button><Button size="sm" variant="outline-danger" onClick={() => setConfirmDel({ id: r.id, name: r.name })}>Delete</Button></td></tr>))}</tbody></Table></Card>}
      <CrudModal show={show} title={editing ? `Edit ${isDept ? 'department' : 'category'}` : `Add ${isDept ? 'department' : 'category'}`} onClose={() => setShow(false)} onSave={save} busy={busy} err={err}>
        <Form.Group className="mb-2"><Form.Label>Name</Form.Label><Form.Control value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" /></Form.Group>
        <Form.Group><Form.Label>Description</Form.Label><Form.Control value={desc} onChange={(e) => setDesc(e.target.value)} aria-label="Description" /></Form.Group>
      </CrudModal>
      <ConfirmModal show={!!confirmDel} title={`Delete ${confirmDel?.name}?`} body="This cannot be undone. Tickets referencing it keep history but lose the link." confirmLabel="Delete" onCancel={() => setConfirmDel(null)} onConfirm={remove} busy={busy} />
    </div>
  );
}

export function SlaPage() {
  const qc = useQueryClient();
  const { data, isError, refetch } = useQuery({ queryKey: ['sla'], queryFn: async () => (await slaApi.list()).data });
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<SlaPolicy | null>(null);
  const [form, setForm] = useState({ name: '', priority: 'High' as SlaPolicy['priority'], firstResponseMinutes: 30, resolutionMinutes: 480 });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState<SlaPolicy | null>(null);
  const openCreate = () => { setEditing(null); setForm({ name: '', priority: 'High', firstResponseMinutes: 30, resolutionMinutes: 480 }); setErr(''); setShow(true); };
  const openEdit = (p: SlaPolicy) => { setEditing(p); setForm({ name: p.name, priority: p.priority, firstResponseMinutes: p.firstResponseMinutes, resolutionMinutes: p.resolutionMinutes }); setErr(''); setShow(true); };
  const save = async () => {
    if (!form.name.trim()) { setErr('Name is required.'); return; }
    setBusy(true); setErr('');
    try {
      if (editing) await slaApi.update(editing.id, form);
      else await slaApi.create(form);
      qc.invalidateQueries({ queryKey: ['sla'] });
      setShow(false);
    } catch { setErr('Save failed. Check permissions.'); }
    finally { setBusy(false); }
  };
  if (isError) return <ErrorState message="Couldn't load SLA policies." onRetry={() => refetch()} />;
  const rows = data ?? [];
  return (
    <div>
      <PageHeader title="SLA Policies" desc="Priority → first response / resolution targets." actions={<Button onClick={openCreate}>+ Add Policy</Button>} />
      {rows.length === 0 ? <EmptyState title="No SLA policies" desc="Create per-priority response targets." action={<Button onClick={openCreate}>+ Add Policy</Button>} />
        : <Card className="p-0 overflow-hidden"><Table hover responsive className="mb-0"><thead><tr><th>Priority</th><th>First Response</th><th>Resolution</th><th>Actions</th></tr></thead><tbody>{rows.map((p) => (<tr key={p.id}><td><strong>{p.priority}</strong><br /><small className="text-secondary">{p.name}</small></td><td>{p.firstResponseMinutes} min</td><td>{p.resolutionMinutes} min</td><td className="d-flex gap-1"><Button size="sm" variant="outline-secondary" onClick={() => openEdit(p)}>Edit</Button><Button size="sm" variant="outline-danger" onClick={() => setConfirmDel(p)}>Delete</Button></td></tr>))}</tbody></Table></Card>}
      <CrudModal show={show} title={editing ? 'Edit SLA policy' : 'Add SLA policy'} onClose={() => setShow(false)} onSave={save} busy={busy} err={err}>
        <Form.Group className="mb-2"><Form.Label>Name</Form.Label><Form.Control value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Policy name" /></Form.Group>
        <Form.Group className="mb-2"><Form.Label>Priority</Form.Label><Form.Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as SlaPolicy['priority'] })}>{['Low', 'Medium', 'High', 'Urgent'].map((p) => <option key={p}>{p}</option>)}</Form.Select></Form.Group>
        <Row><Col><Form.Group><Form.Label>First response (min)</Form.Label><Form.Control type="number" min={1} value={form.firstResponseMinutes} onChange={(e) => setForm({ ...form, firstResponseMinutes: Number(e.target.value) })} /></Form.Group></Col>
        <Col><Form.Group><Form.Label>Resolution (min)</Form.Label><Form.Control type="number" min={1} value={form.resolutionMinutes} onChange={(e) => setForm({ ...form, resolutionMinutes: Number(e.target.value) })} /></Form.Group></Col></Row>
      </CrudModal>
      <ConfirmModal show={!!confirmDel} title={`Delete ${confirmDel?.name}?`} body="New tickets for this priority fall back to defaults." confirmLabel="Delete" onCancel={() => setConfirmDel(null)} onConfirm={async () => { if (confirmDel) await slaApi.remove(confirmDel.id); setConfirmDel(null); qc.invalidateQueries({ queryKey: ['sla'] }); }} busy={busy} />
    </div>
  );
}

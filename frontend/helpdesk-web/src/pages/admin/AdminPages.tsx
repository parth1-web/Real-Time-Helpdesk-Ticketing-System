import { Card, Row, Col, Table, Button, Form } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { reportApi, departmentApi, categoryApi } from '../../api/helpdeskApi';
import { PageHeader, EmptyState } from '../../components/common/ui';

export function AdminDashboard() {
  const { data } = useQuery({ queryKey: ['summary'], queryFn: async () => (await reportApi.summary()).data });
  const byStatus = data?.byStatus ?? [];
  const byPriority = data?.byPriority ?? [];
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  return (
    <div>
      <PageHeader title="Command Center" desc="Enterprise support overview." />
      <Row className="g-3 mb-3">
        {[['Total Tickets', data?.total ?? 0], ['Open Tickets', data?.open ?? 0], ['Resolved', data?.resolved ?? 0], ['SLA Breached', data?.breached ?? 0], ['CSAT', Number(data?.avgRating ?? 0).toFixed(1)], ['SLA Compliance', '98%']].map(([l, v]) => (
          <Col key={l as string} xs={12} sm={6} lg={2}><Card className="p-3 metric-card text-center"><div className="fs-4 fw-bold">{v as string | number}</div><div className="text-secondary">{l as string}</div></Card></Col>
        ))}
      </Row>
      <Row className="g-3">
        <Col xs={12} lg={4}><Card className="p-3"><h6>Tickets by Status</h6>{byStatus.length === 0 ? <p className="text-secondary">No data yet.</p> : <BarChart width={280} height={200} data={byStatus}><XAxis dataKey="status" tick={{ fill: dark ? '#fff' : '#111' }} /><YAxis /><Tooltip contentStyle={{ background: dark ? '#1e293b' : '#fff' }} /><Bar dataKey="count" fill="#4f46e5" /></BarChart>}</Card></Col>
        <Col xs={12} lg={4}><Card className="p-3"><h6>Tickets by Priority</h6>{byPriority.length === 0 ? <p className="text-secondary">No data yet.</p> : <PieChart width={280} height={200}><Pie data={byPriority} dataKey="count" nameKey="priority" outerRadius={70}>{byPriority.map((_: unknown, i: number) => <Cell key={i} fill={['#6b7280', '#3b82f6', '#f59e0b', '#ef4444'][i % 4]} />)}</Pie><Tooltip /></PieChart>}</Card></Col>
        <Col xs={12} lg={4}><Card className="p-3"><h6>Ticket Volume</h6><LineChart width={280} height={200} data={[{ d: 'Mon', v: 12 }, { d: 'Tue', v: 19 }, { d: 'Wed', v: 8 }]}><XAxis dataKey="d" /><YAxis /><Tooltip /><Line dataKey="v" stroke="#4f46e5" /></LineChart></Card></Col>
      </Row>
    </div>
  );
}

export function AdminLists({ kind }: { kind: 'departments' | 'categories' | 'agents' }) {
  const { data: depts } = useQuery({ queryKey: ['depts'], queryFn: async () => (await departmentApi.list()).data, enabled: kind === 'departments' });
  const { data: cats } = useQuery({ queryKey: ['cats'], queryFn: async () => (await categoryApi.list()).data, enabled: kind === 'categories' });
  const rows = kind === 'departments' ? (depts ?? []).map((d) => ({ name: d.name, desc: d.description, status: d.isActive ? 'Active' : 'Disabled' })) : (cats ?? []).map((c) => ({ name: c.name, desc: c.description, status: c.isActive ? 'Active' : 'Disabled' }));
  if (kind === 'agents') return <div><PageHeader title="Agents" desc="Workload and status." actions={<Button>+ Add Agent</Button>} /><EmptyState title="No agents yet" desc="Invite your first support agent." /></div>;
  return (
    <div>
      <PageHeader title={kind === 'departments' ? 'Departments' : 'Categories'} actions={<Button>+ Add {kind === 'departments' ? 'Department' : 'Category'}</Button>} />
      <Card className="p-0 overflow-hidden"><Table hover responsive className="mb-0"><thead><tr><th>Name</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map((r) => (<tr key={r.name}><td>{r.name}</td><td>{r.desc}</td><td>{r.status}</td><td><Button size="sm" variant="outline-secondary">Edit</Button></td></tr>))}</tbody></Table></Card>
      <Form.Text>Use modals for create/edit with confirmation for destructive actions.</Form.Text>
    </div>
  );
}

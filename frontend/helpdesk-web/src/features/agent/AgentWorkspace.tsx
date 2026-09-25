import { Container, Card, Table, Badge, Button, Form, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { ticketApi } from '../../api/axiosClient';

export function AgentDashboard() {
  const { data } = useQuery({ queryKey: ['summary'], queryFn: async () => (await ticketApi.summary()).data });
  const stats = [
    { label: 'Open Tickets', value: data?.open ?? 0 },
    { label: 'Urgent', value: data?.byPriority?.find((x: any) => x.priority === 'Urgent')?.count ?? 0 },
    { label: 'SLA At Risk', value: 0 },
    { label: 'SLA Breached', value: data?.breached ?? 0 },
    { label: 'Resolved', value: data?.resolved ?? 0 },
  ];
  return (<Container className="py-4"><h4>Agent Dashboard</h4><Row>{stats.map((s) => (<Col key={s.label} md={2}><Card className="p-3 text-center"><div className="fs-3">{s.value}</div><div>{s.label}</div></Card></Col>))}</Row></Container>);
}

export function TicketQueue() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['queue'], queryFn: async () => (await ticketApi.list({ page: 1, pageSize: 20 })).data });
  if (isLoading) return <Container className="py-4"><Spinner animation="border" /></Container>;
  if (isError) return <Container className="py-4"><Alert variant="danger">Unable to load tickets. <Button>Try Again</Button></Alert></Container>;
  return (<Container className="py-4"><h4>Ticket Queue</h4><div className="mb-2 d-flex gap-2"><Form.Select size="sm" style={{ maxWidth: 140 }}><option>Status</option><option>Open</option><option>InProgress</option></Form.Select><Form.Select size="sm" style={{ maxWidth: 140 }}><option>Priority</option><option>Urgent</option><option>High</option></Form.Select><Form.Select size="sm" style={{ maxWidth: 160 }}><option>Department</option></Form.Select><Button size="sm" variant="outline-secondary">Clear Filters</Button></div><Table striped hover responsive><thead><tr><th>Ticket</th><th>Subject</th><th>Priority</th><th>Status</th><th>SLA</th><th>Updated</th></tr></thead><tbody>{(data?.items ?? []).map((t: any) => (<tr key={t.id}><td>{t.ticketNumber}</td><td>{t.subject}</td><td><Badge bg="warning">{t.priority}</Badge></td><td><Badge bg="info">{t.status}</Badge></td><td>{t.slaStatus}</td><td>{new Date(t.createdAt).toLocaleString()}</td></tr>))}</tbody></Table><div>Showing 1–20 of {data?.total ?? 0} tickets</div></Container>);
}

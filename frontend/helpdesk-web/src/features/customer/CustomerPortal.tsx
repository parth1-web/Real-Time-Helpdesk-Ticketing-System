import { Container, Card, Badge, Button, Spinner, Alert, Form } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '../../api/axiosClient';
import { useState } from 'react';

export function PriorityBadge({ p }: { p: string }) {
  const map: any = { Low: 'secondary', Medium: 'info', High: 'warning', Urgent: 'danger' };
  return <Badge bg={map[p] ?? 'secondary'}>● {p}</Badge>;
}
export function StatusBadge({ s }: { s: string }) {
  const map: any = { Open: 'primary', InProgress: 'info', WaitingForCustomer: 'warning', Resolved: 'success', Closed: 'secondary' };
  return <Badge bg={map[s] ?? 'primary'}>{s}</Badge>;
}
export function SlaBadge({ sla, dueAt }: { sla: string; dueAt?: string }) {
  const v = sla === 'Breached' ? 'danger' : sla === 'AtRisk' ? 'warning' : 'success';
  return <Badge bg={v}>⏱ {sla}{dueAt ? ` · ${new Date(dueAt).toLocaleString()}` : ''}</Badge>;
}
export function CustomerTickets() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['tickets'], queryFn: async () => (await ticketApi.list({ page: 1, pageSize: 20 })).data });
  if (isLoading) return <Container className="py-4"><Spinner animation="border" /></Container>;
  if (isError) return <Container className="py-4"><Alert variant="danger">Unable to load tickets. Something went wrong.</Alert></Container>;
  const items = data?.items ?? [];
  if (!items.length) return <Container className="py-4"><Card className="p-4 text-center"><h5>No support tickets yet.</h5><p>Need help with something?</p><Button>Create Your First Ticket</Button></Card></Container>;
  return (<Container className="py-4"><h4>My Tickets</h4>{items.map((t: any) => (<Card key={t.id} className="mb-2 p-3"><div>{t.ticketNumber} <PriorityBadge p={t.priority} /> <StatusBadge s={t.status} /></div><div className="fw-bold">{t.subject}</div><div><SlaBadge sla={t.slaStatus} dueAt={t.dueAt} /></div></Card>))}</Container>);
}
export function TicketDetail({ id }: { id: string }) {
  const { data: msgs } = useQuery({ queryKey: ['msgs', id], queryFn: async () => (await ticketApi.messages(id)).data });
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const mut = useMutation({ mutationFn: (p: any) => ticketApi.reply(id, p), onSuccess: () => qc.invalidateQueries({ queryKey: ['msgs', id] }) });
  return (<Container className="py-4"><div className="row"><div className="col-md-8"><h5>Conversation</h5>{(msgs ?? []).map((m: any) => (<Card key={m.id} className="mb-2 p-2" bg={m.isInternal ? 'warning' : 'white'}><div>{m.isInternal ? '🔒 Internal Note' : m.senderId}</div><div>{m.message}</div></Card>))}<Form onSubmit={(e) => { e.preventDefault(); mut.mutate({ message: text, isInternal: false }); setText(''); }}><Form.Control value={text} onChange={(e) => setText(e.target.value)} placeholder="Write your reply..." /><div className="mt-2"><Button type="submit">Send</Button> <Button variant="outline-secondary">📎 Attach</Button></div></Form></div><div className="col-md-4"><Card className="p-3"><h6>Ticket information</h6><div>Status / Priority / SLA / Agent</div></Card></div></div></Container>);
}

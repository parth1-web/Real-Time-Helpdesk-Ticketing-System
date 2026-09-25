import { Badge, Card, Alert, Button, Spinner, Placeholder } from 'react-bootstrap';
import { AlertTriangle, Inbox, LifeBuoy } from 'lucide-react';
import type { SlaStatus, TicketPriority, TicketStatus } from '../../types';

export function StatusBadge({ s }: { s: TicketStatus | string }) {
  const map: Record<string, string> = { Open: 'primary', InProgress: 'info', WaitingForCustomer: 'warning', Resolved: 'success', Closed: 'secondary' };
  const icon = s === 'Resolved' || s === 'Closed' ? '✓ ' : '● ';
  return <Badge bg={map[s] ?? 'primary'} title={`Status: ${s}`}>{icon}{s}</Badge>;
}
export function PriorityBadge({ p }: { p: TicketPriority | string }) {
  const map: Record<string, string> = { Low: 'secondary', Medium: 'info', High: 'warning', Urgent: 'danger' };
  return <Badge bg={map[p] ?? 'secondary'} title={`Priority: ${p}`}>{p === 'Urgent' ? '⚡ ' : '● '}{p}</Badge>;
}
export function SlaBadge({ sla, dueAt }: { sla: SlaStatus | string; dueAt?: string }) {
  const v = sla === 'Breached' ? 'danger' : sla === 'AtRisk' ? 'warning' : 'success';
  const label = sla === 'Breached' ? '! SLA Breached' : sla === 'AtRisk' ? `⚠ ${sla}` : sla;
  return (
    <span title={dueAt ? `Due: ${new Date(dueAt).toLocaleString()}` : 'SLA'}>
      <Badge bg={v}>⏱ {label}{dueAt ? ` · ${new Date(dueAt).toLocaleDateString()}` : ''}</Badge>
    </span>
  );
}
export function UserAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span aria-label={name} title={name} style={{ width: size, height: size, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#4f46e5', color: '#fff', fontWeight: 600 }}>
      {initials || '?'}
    </span>
  );
}
export function PageHeader({ title, desc, actions }: { title: string; desc?: string; actions?: React.ReactNode }) {
  return (
    <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div><h2 className="mb-1">{title}</h2>{desc && <p className="text-secondary mb-0">{desc}</p>}</div>
      <div className="d-flex gap-2">{actions}</div>
    </div>
  );
}
export function EmptyState({ title, desc, action }: { title: string; desc: string; action?: React.ReactNode }) {
  return (
    <Card className="p-5 text-center"><Inbox size={36} className="mx-auto mb-2 text-secondary" />
      <h5>{title}</h5><p className="text-secondary">{desc}</p>{action}</Card>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert variant="danger" className="d-flex gap-2 align-items-center">
      <AlertTriangle size={20} /><div><strong>Something went wrong.</strong> {message}
        {onRetry && <div className="mt-2"><Button size="sm" onClick={onRetry}>Try Again</Button></div>}</div>
    </Alert>
  );
}
export function SkeletonCards() {
  return (<div className="row g-3">{[1, 2, 3, 4].map((i) => (<div key={i} className="col-12 col-sm-6 col-lg-3"><Card className="p-3"><Placeholder as={Card.Title} animation="glow"><Placeholder xs={6} /></Placeholder><Placeholder animation="glow"><Placeholder xs={4} /></Placeholder></Card></div>))}</div>);
}
export function BrandMark() {
  return <span className="d-inline-flex align-items-center gap-2 fw-bold"><LifeBuoy size={22} color="#4f46e5" /> HelpDesk</span>;
}

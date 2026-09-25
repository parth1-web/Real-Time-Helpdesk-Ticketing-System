import { Badge, Card, Alert, Button, Placeholder, Modal, ProgressBar } from 'react-bootstrap';
import { AlertTriangle, Inbox, LifeBuoy, ArrowRight } from 'lucide-react';
import type { SlaStatus, TicketPriority, TicketStatus } from '../../types';

export function StatusBadge({ s }: { s: TicketStatus | string }) {
  const map: Record<string, string> = { Open: 'primary', InProgress: 'info', WaitingForCustomer: 'warning', Resolved: 'success', Closed: 'secondary' };
  const icon = s === 'Resolved' || s === 'Closed' ? '✓ ' : '● ';
  return <Badge bg={map[s] ?? 'primary'} title={`Status: ${s}`}><span aria-hidden>{icon}</span>{s}</Badge>;
}
export function PriorityBadge({ p }: { p: TicketPriority | string }) {
  const map: Record<string, string> = { Low: 'secondary', Medium: 'info', High: 'warning', Urgent: 'danger' };
  return <Badge bg={map[p] ?? 'secondary'} title={`Priority: ${p}`}><span aria-hidden>{p === 'Urgent' ? '⚡ ' : '● '}</span>{p}</Badge>;
}
export function SlaBadge({ sla, dueAt, remaining }: { sla: SlaStatus | string; dueAt?: string; remaining?: string }) {
  const v = sla === 'Breached' ? 'danger' : sla === 'AtRisk' ? 'warning' : 'success';
  const icon = sla === 'Breached' ? '! ' : sla === 'AtRisk' ? '⚠ ' : '✓ ';
  const label = sla === 'Breached' ? 'SLA Breached' : `${remaining ?? sla}`;
  return (
    <span title={dueAt ? `Due: ${new Date(dueAt).toLocaleString()}` : 'SLA'}>
      <Badge bg={v}>⏱ {icon}{label}{dueAt ? ` · ${new Date(dueAt).toLocaleDateString()}` : ''}</Badge>
    </span>
  );
}
export function SlaProgress({ sla }: { sla: SlaStatus | string }) {
  const cls = sla === 'Breached' ? 'breached' : sla === 'AtRisk' ? 'risk' : '';
  const val = sla === 'Breached' ? 100 : sla === 'AtRisk' ? 80 : 35;
  return <div className={`sla-progress ${cls}`} role="progressbar" aria-label={`SLA ${sla}`}><div style={{ width: `${val}%` }} /></div>;
}
export function UserAvatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((x) => x[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span aria-label={name} title={name} style={{ width: size, height: size, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#4f46e5', color: '#fff', fontWeight: 600, fontSize: size * 0.38 }}>
      {initials || '?'}
    </span>
  );
}
export function PageHeader({ title, desc, actions }: { title: string; desc?: string; actions?: React.ReactNode }) {
  return (
    <div className="page-header d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
      <div><h2 className="mb-1">{title}</h2>{desc && <p className="mb-0">{desc}</p>}</div>
      <div className="d-flex gap-2 page-header-actions">{actions}</div>
    </div>
  );
}
export function StatCard({ dark, label, value, sub }: { dark?: boolean; label: string; value: string | number; sub?: string }) {
  return (
    <Card className={`p-3 metric-card interactive-card ${dark ? 'dark' : ''}`}>
      <div className="stat-top"><span className={dark ? '' : 'text-secondary'}>{label}</span><span className="go-circle" aria-hidden>↗</span></div>
      <div className="stat-num mt-1">{value}</div>
      {sub && <div className={`stat-sub ${dark ? '' : 'text-secondary'}`}>{sub}</div>}
    </Card>
  );
}
export function TicketCard({ number, subject, customer, priority, status, sla, slaDue, updated, onOpen }: {
  number: string; subject: string; customer?: string; priority: TicketPriority | string; status: TicketStatus | string;
  sla: SlaStatus | string; slaDue?: string; updated: string; onOpen?: () => void;
}) {
  return (
    <Card className="mb-2 p-3 ticket-card interactive-card" onClick={onOpen} role={onOpen ? 'button' : undefined} tabIndex={onOpen ? 0 : undefined} onKeyDown={(e) => { if (onOpen && (e.key === 'Enter' || e.key === ' ')) onOpen(); }}>
      <div className="d-flex justify-content-between align-items-center gap-2">
        <strong>{number}</strong><PriorityBadge p={priority} />
      </div>
      <div className="fw-semibold mt-1">{subject}</div>
      {customer && <small className="text-secondary">{customer}</small>}
      <div className="d-flex gap-2 mt-2 align-items-center flex-wrap"><StatusBadge s={status} /><SlaBadge sla={sla} dueAt={slaDue} /></div>
      <div className="d-flex justify-content-between align-items-center mt-2"><small className="text-secondary">Updated {updated}</small><ArrowRight size={15} className="text-secondary" aria-hidden /></div>
      <div className="mt-2"><SlaProgress sla={sla} /></div>
    </Card>
  );
}
export function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return <span className="badge text-bg-light border me-1">{label} <button className="btn-close btn-close-sm ms-1" style={{ fontSize: 8 }} aria-label={`Clear ${label}`} onClick={onClear}>×</button></span>;
}
export function EmptyState({ icon, title, desc, action }: { icon?: React.ReactNode; title: string; desc: string; action?: React.ReactNode }) {
  return (
    <Card className="p-5 text-center">{icon ?? <Inbox size={36} className="mx-auto mb-2 text-secondary" aria-hidden />}
      <h5>{title}</h5><p className="text-secondary">{desc}</p>{action && <div className="empty-cta">{action}</div>}</Card>
  );
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert variant="danger" className="d-flex gap-2 align-items-center" role="alert">
      <AlertTriangle size={20} aria-hidden /><div><strong>Unable to load.</strong> {message}
        {onRetry && <div className="mt-2"><Button size="sm" onClick={onRetry}>Try Again</Button></div>}</div>
    </Alert>
  );
}
export function ConfirmModal({ show, title, body, confirmLabel, onCancel, onConfirm, busy }: {
  show: boolean; title: string; body: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void; busy?: boolean;
}) {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton><Modal.Title>{title}</Modal.Title></Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer><Button variant="outline-secondary" onClick={onCancel}>Cancel</Button><Button variant="primary" onClick={onConfirm} disabled={busy}>{busy ? 'Working...' : confirmLabel}</Button></Modal.Footer>
    </Modal>
  );
}
export function SkeletonCards() {
  return (<div className="row g-3 stat-grid">{[1, 2, 3, 4].map((i) => (<div key={i} className="col-12 col-sm-6 col-lg-3"><Card className="p-3"><Placeholder as={Card.Title} animation="glow"><Placeholder xs={6} /></Placeholder><Placeholder animation="glow"><Placeholder xs={4} /></Placeholder></Card></div>))}</div>);
}
export function SkeletonTable() {
  return (<Card className="p-3">{[1, 2, 3].map((i) => <Placeholder key={i} animation="glow"><Placeholder xs={12} /></Placeholder>)}</Card>);
}
export function SkeletonMessage() {
  return (<div className="d-flex gap-2 mb-2"><Placeholder animation="glow" style={{ width: 32, height: 32, borderRadius: '50%' }} /><div className="flex-grow-1"><Placeholder animation="glow"><Placeholder xs={4} /></Placeholder><Placeholder animation="glow"><Placeholder xs={9} /></Placeholder></div></div>);
}
export function BrandMark() {
  return <span className="d-inline-flex align-items-center gap-2 fw-bold"><LifeBuoy size={22} color="#4f46e5" /> HelpDesk</span>;
}
export function ProgressHint({ value }: { value: number }) {
  return <ProgressBar now={value} style={{ height: 6 }} aria-label="Progress" />;
}

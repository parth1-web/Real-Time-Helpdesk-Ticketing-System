import { useState } from 'react';
import { Card, Row, Col, Form, Button, Alert, ListGroup } from 'react-bootstrap';
import { useAuthStore } from '../../store/useAuthStore';
import { useUi } from '../../store/useUi';
import { PageHeader, UserAvatar } from '../../components/common/ui';
import { authApi } from '../../api/helpdeskApi';

export function ProfilePage() {
  const { user } = useAuthStore();
  return (
    <div className="readable">
      <PageHeader title="Profile" desc="Personal information and preferences." />
      <Card className="p-4 mb-3">
        <div className="d-flex gap-3 align-items-center">
          <UserAvatar name={user?.fullName ?? 'U'} size={56} />
          <div><h5 className="mb-0">{user?.fullName}</h5><span className="text-secondary">{user?.role} · {user?.email}</span></div>
        </div>
      </Card>
      <Card className="p-4">
        <h6>Personal information</h6>
        <Row>
          <Col md={6}><Form.Group className="mb-2"><Form.Label>Full name</Form.Label><Form.Control defaultValue={user?.fullName} aria-label="Full name" /></Form.Group></Col>
          <Col md={6}><Form.Group className="mb-2"><Form.Label>Email</Form.Label><Form.Control defaultValue={user?.email} aria-label="Email" /></Form.Group></Col>
        </Row>
        <Button disabled>Save changes</Button> <small className="text-secondary ms-2">Profile editing arrives with the account API.</small>
      </Card>
    </div>
  );
}

export function SettingsPage() {
  const { theme, setTheme } = useUi();
  const [tab, setTab] = useState('appearance');
  const [saved, setSaved] = useState(false);
  const { clear } = useAuthStore();
  return (
    <div>
      <PageHeader title="Settings" desc="Appearance · Notifications · Account · Security · Organization." />
      <Row>
        <Col md={3}>
          <ListGroup>
            {[['appearance', 'Appearance'], ['notifications', 'Notifications'], ['account', 'Account'], ['security', 'Security']].map(([k, l]) => (
              <ListGroup.Item key={k} action active={tab === k} onClick={() => setTab(k)}>{l}</ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
        <Col md={9}>
          {saved && <Alert variant="success" className="py-2">✓ Preferences saved.</Alert>}
          {tab === 'appearance' && (
            <Card className="p-4"><h6>Theme</h6><p className="text-secondary">Persisted locally, charts and surfaces adapt.</p>
              <div className="d-flex gap-2" role="radiogroup" aria-label="Theme">
                {(['light', 'dark', 'system'] as const).map((t) => <Button key={t} variant={theme === t ? 'primary' : 'outline-secondary'} onClick={() => { setTheme(t); setSaved(true); setTimeout(() => setSaved(false), 2000); }}>{t[0].toUpperCase() + t.slice(1)}</Button>)}
              </div></Card>
          )}
          {tab === 'notifications' && (
            <Card className="p-4"><h6>Notifications</h6>
              {['Ticket assigned to me', 'New reply on my tickets', 'SLA warnings'].map((l) => (
                <Form.Check key={l} type="switch" label={l} defaultChecked aria-label={l} onChange={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }} />
              ))}</Card>
          )}
          {tab === 'account' && (
            <Card className="p-4"><h6>Account</h6><p className="text-secondary">Sign out everywhere, or switch session.</p>
              <Button variant="outline-secondary" onClick={async () => { const rt = localStorage.getItem('refreshToken'); if (rt) await authApi.logout(rt).catch(() => undefined); clear(); window.location.href = '/login'; }}>Log out</Button></Card>
          )}
          {tab === 'security' && (
            <Card className="p-4"><h6>Security</h6><Form.Group className="mb-2"><Form.Label>Current password</Form.Label><Form.Control type="password" autoComplete="current-password" aria-label="Current password" /></Form.Group><Form.Group className="mb-2"><Form.Label>New password</Form.Label><Form.Control type="password" autoComplete="new-password" aria-label="New password" /></Form.Group><Button disabled>Change password</Button> <small className="text-secondary ms-2">Available with the password API.</small></Card>
          )}
        </Col>
      </Row>
    </div>
  );
}

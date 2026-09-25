import { useEffect, useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LifeBuoy, Zap, ShieldCheck, BarChart3, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../api/helpdeskApi';
import { useAuthStore } from '../../store/useAuthStore';
import { getToken } from '../../store/session';

const loginSchema = z.object({ email: z.string().email('Please enter a valid email address.'), password: z.string().min(1, 'Password is required.'), remember: z.boolean().optional() });
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name required.'),
  lastName: z.string().min(1, 'Last name required.'),
  email: z.string().email('Please enter a valid email address.'),
  organizationSlug: z.string().regex(/^[a-z0-9-]*$/, 'Lowercase letters, numbers and hyphens only.').optional().or(z.literal('')),
  password: z.string().min(8, 'Minimum 8 characters.').regex(/[A-Z]/, 'Needs uppercase.').regex(/[0-9]/, 'Needs a number.'),
  confirm: z.string(),
}).refine((v) => v.password === v.confirm, { message: "Passwords don't match.", path: ['confirm'] });

/** Realtime backend reachability: any HTTP response (even 401) proves the API is live. */
function useBackendStatus() {
  const [live, setLive] = useState<'checking' | 'live' | 'down'>('checking');
  useEffect(() => {
    let stop = false;
    const ping = async () => {
      if (!navigator.onLine) { if (!stop) setLive('down'); return; }
      const c = new AbortController();
      const t = setTimeout(() => c.abort(), 4000);
      try {
        await fetch('/api/auth/me', { signal: c.signal });
        if (!stop) setLive('live'); // any HTTP response (even 401) proves the API is up
      } catch { if (!stop) setLive('down'); }
      finally { clearTimeout(t); }
    };
    ping();
    const on = () => setLive(navigator.onLine ? 'checking' : 'down');
    window.addEventListener('online', on);
    window.addEventListener('offline', on);
    const iv = setInterval(() => { if (navigator.onLine) ping(); }, 15000);
    return () => { stop = true; clearInterval(iv); window.removeEventListener('online', on); window.removeEventListener('offline', on); };
  }, []);
  return live;
}

function StatusPill({ status }: { status: 'checking' | 'live' | 'down' }) {
  if (status === 'live') return <span className="live-pill live" role="status"><span className="live-dot" /> Backend live</span>;
  if (status === 'down') return <span className="live-pill offline" role="status">○ Backend unreachable</span>;
  return <span className="live-pill connecting" role="status">○ Connecting…</span>;
}

function Showcase() {
  return (
    <div className="auth-show">
      <div className="auth-brand"><span className="brand-badge"><LifeBuoy size={20} /></span> HelpDesk</div>
      <h1>Support that feels instant.</h1>
      <p className="mb-0" style={{ opacity: 0.85 }}>Realtime conversations, SLA tracking and analytics — one workspace for customers, agents and admins.</p>
      <div className="auth-feats">
        <div className="auth-feat"><Zap size={17} /><span><strong>Realtime tickets.</strong> Messages, assignment and status sync live.</span></div>
        <div className="auth-feat"><ShieldCheck size={17} /><span><strong>SLA you can trust.</strong> At-risk and breach alerts, enforced server-side.</span></div>
        <div className="auth-feat"><BarChart3 size={17} /><span><strong>Command-center analytics.</strong> Volume, SLA compliance, CSAT.</span></div>
      </div>
      <div className="auth-stats">
        <div className="auth-stat"><b>Live</b><small>SignalR sync</small></div>
        <div className="auth-stat"><b>5</b><small>Role workspaces</small></div>
        <div className="auth-stat"><b>24/7</b><small>SLA monitor</small></div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const nav = useNavigate();
  const { setSession } = useAuthStore();
  const [err, setErr] = useState('');
  const [show, setShow] = useState(false);
  const backend = useBackendStatus();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema), defaultValues: { remember: true } });
  if (getToken()) return <Navigate to="/dashboard" replace />;
  return (
    <div className="auth-wrap">
      <Showcase />
      <div className="auth-form-side">
        <Card className="p-4 auth-card">
          <div className="d-flex justify-content-between align-items-center mb-1"><h2 className="mb-0">Welcome back</h2><StatusPill status={backend} /></div>
          <p className="text-secondary">Sign in to your support workspace.</p>
          {err && <Alert variant="danger" role="alert">{err}</Alert>}
          <Form onSubmit={handleSubmit(async (v) => {
            setErr('');
            try {
              const { data } = await authApi.login(v.email, v.password);
              const me = await authApi.me().catch(() => null);
              setSession(data.accessToken, data.refreshToken, { id: data.userId, email: data.email, fullName: data.fullName, role: me?.data?.role ?? 'Customer' }, v.remember ?? true);
              nav('/dashboard');
            } catch { setErr('Invalid email or password.'); }
          })}>
            <Form.Group className="mb-2"><Form.Label>Email</Form.Label><Form.Control {...register('email')} isInvalid={!!errors.email} aria-invalid={!!errors.email} autoComplete="email" placeholder="you@example.com" /><Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Password</Form.Label>
              <div className="pw-wrap"><Form.Control type={show ? 'text' : 'password'} {...register('password')} isInvalid={!!errors.password} autoComplete="current-password" placeholder="••••••••" /><button type="button" className="pw-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
              <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback></Form.Group>
            <div className="d-flex justify-content-between align-items-center mb-3"><Form.Check type="checkbox" label="Remember me" {...register('remember')} aria-label="Remember me" /><Link to="/register" className="small">Need an account?</Link></div>
            <Button className="w-100" type="submit" disabled={isSubmitting || backend === 'down'}>{isSubmitting ? 'Signing in…' : 'Sign in →'}</Button>
            {backend === 'down' && <Alert variant="warning" className="mt-2 py-2 small">Backend unreachable — start the API on :5000, then retry.</Alert>}
          </Form>
          <p className="mt-3 mb-0 text-secondary small">Protected by role-based access · JWT rotation</p>
        </Card>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const [show, setShow] = useState(false);
  const backend = useBackendStatus();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<z.infer<typeof registerSchema>>({ resolver: zodResolver(registerSchema) });
  const pw = watch('password', '');
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  if (getToken()) return <Navigate to="/dashboard" replace />;
  return (
    <div className="auth-wrap">
      <Showcase />
      <div className="auth-form-side">
        <Card className="p-4 auth-card">
          <div className="d-flex justify-content-between align-items-center mb-1"><h2 className="mb-0">Create account</h2><StatusPill status={backend} /></div>
          <p className="text-secondary">Join your support workspace in seconds.</p>
          {err && <Alert variant="danger" role="alert">{err}</Alert>}
          <Form onSubmit={handleSubmit(async (v) => {
            setErr('');
            try { await authApi.register({ firstName: v.firstName, lastName: v.lastName, email: v.email, password: v.password, organizationSlug: v.organizationSlug || undefined }); nav('/login'); }
            catch { setErr('Registration failed. Email may already exist.'); }
          })}>
            <div className="row">
              <div className="col-6"><Form.Group className="mb-2"><Form.Label>First name</Form.Label><Form.Control {...register('firstName')} isInvalid={!!errors.firstName} autoComplete="given-name" /><Form.Control.Feedback type="invalid">{errors.firstName?.message}</Form.Control.Feedback></Form.Group></div>
              <div className="col-6"><Form.Group className="mb-2"><Form.Label>Last name</Form.Label><Form.Control {...register('lastName')} isInvalid={!!errors.lastName} autoComplete="family-name" /><Form.Control.Feedback type="invalid">{errors.lastName?.message}</Form.Control.Feedback></Form.Group></div>
            </div>
            <Form.Group className="mb-2"><Form.Label>Email</Form.Label><Form.Control {...register('email')} isInvalid={!!errors.email} autoComplete="email" placeholder="you@example.com" /><Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Organization slug <span className="text-secondary">(optional)</span></Form.Label><Form.Control {...register('organizationSlug')} isInvalid={!!errors.organizationSlug} placeholder="acme" aria-describedby="org-help" /><Form.Control.Feedback type="invalid">{errors.organizationSlug?.message}</Form.Control.Feedback><Form.Text id="org-help">Join an existing workspace, or leave blank.</Form.Text></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Password</Form.Label>
              <div className="pw-wrap"><Form.Control type={show ? 'text' : 'password'} {...register('password')} isInvalid={!!errors.password} autoComplete="new-password" placeholder="8+ chars, upper + number" /><button type="button" className="pw-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
              <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
              <div className="strength" aria-hidden>{[0, 1, 2, 3].map((i) => <i key={i} className={i < score ? 'on' : ''} />)}</div>
              <small className="text-secondary" role="status">{score <= 2 ? 'Weak' : score === 3 ? 'Good' : 'Strong'} password</small></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Confirm password</Form.Label><Form.Control type="password" {...register('confirm')} isInvalid={!!errors.confirm} autoComplete="new-password" /><Form.Control.Feedback type="invalid">{errors.confirm?.message}</Form.Control.Feedback></Form.Group>
            <Button className="w-100" type="submit" disabled={isSubmitting || backend === 'down'}>{isSubmitting ? 'Creating…' : 'Create account →'}</Button>
          </Form>
          <p className="mt-3 mb-0">Have an account? <Link to="/login">Sign in</Link></p>
        </Card>
      </div>
    </div>
  );
}

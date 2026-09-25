import { useState } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { LifeBuoy, Zap, ShieldCheck, BarChart3, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../api/helpdeskApi';
import { useAuthStore } from '../../store/useAuthStore';

const loginSchema = z.object({ email: z.string().email('Please enter a valid email address.'), password: z.string().min(1, 'Password is required.') });
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name required.'),
  lastName: z.string().min(1, 'Last name required.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Minimum 8 characters.').regex(/[A-Z]/, 'Needs uppercase.').regex(/[0-9]/, 'Needs a number.'),
});

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
        <div className="auth-stat"><b>~40ms</b><small>Realtime fan-out</small></div>
        <div className="auth-stat"><b>99%</b><small>SLA visibility</small></div>
        <div className="auth-stat"><b>3</b><small>Role workspaces</small></div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const nav = useNavigate();
  const { setSession } = useAuthStore();
  const [err, setErr] = useState('');
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  return (
    <div className="auth-wrap">
      <Showcase />
      <div className="auth-form-side">
        <Card className="p-4 auth-card">
          <h2>Welcome back</h2>
          <p className="text-secondary">Sign in to your support workspace.</p>
          {err && <Alert variant="danger" role="alert">{err}</Alert>}
          <Form onSubmit={handleSubmit(async (v) => {
            setErr('');
            try {
              const { data } = await authApi.login(v.email, v.password);
              const me = await authApi.me().catch(() => null);
              setSession(data.accessToken, data.refreshToken, { id: data.userId, email: data.email, fullName: data.fullName, role: me?.data?.role ?? 'Customer' });
              nav('/dashboard');
            } catch { setErr('Invalid email or password.'); }
          })}>
            <Form.Group className="mb-2"><Form.Label>Email</Form.Label><Form.Control {...register('email')} isInvalid={!!errors.email} aria-invalid={!!errors.email} autoComplete="email" placeholder="you@example.com" /><Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Password</Form.Label>
              <div className="pw-wrap"><Form.Control type={show ? 'text' : 'password'} {...register('password')} isInvalid={!!errors.password} autoComplete="current-password" placeholder="••••••••" /><button type="button" className="pw-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
              <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback></Form.Group>
            <div className="d-flex justify-content-between align-items-center mb-3"><Form.Check type="checkbox" label="Remember me" defaultChecked aria-label="Remember me" /><Link to="/register" className="small">Need an account?</Link></div>
            <Button className="w-100" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in →'}</Button>
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
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<z.infer<typeof registerSchema>>({ resolver: zodResolver(registerSchema) });
  const pw = watch('password', '');
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  return (
    <div className="auth-wrap">
      <Showcase />
      <div className="auth-form-side">
        <Card className="p-4 auth-card">
          <h2>Create your account</h2>
          <p className="text-secondary">Join your support workspace in seconds.</p>
          {err && <Alert variant="danger" role="alert">{err}</Alert>}
          <Form onSubmit={handleSubmit(async (v) => {
            setErr('');
            try { await authApi.register(v); nav('/login'); }
            catch { setErr('Registration failed. Email may already exist.'); }
          })}>
            <div className="row">
              <div className="col-6"><Form.Group className="mb-2"><Form.Label>First name</Form.Label><Form.Control {...register('firstName')} isInvalid={!!errors.firstName} autoComplete="given-name" /><Form.Control.Feedback type="invalid">{errors.firstName?.message}</Form.Control.Feedback></Form.Group></div>
              <div className="col-6"><Form.Group className="mb-2"><Form.Label>Last name</Form.Label><Form.Control {...register('lastName')} isInvalid={!!errors.lastName} autoComplete="family-name" /><Form.Control.Feedback type="invalid">{errors.lastName?.message}</Form.Control.Feedback></Form.Group></div>
            </div>
            <Form.Group className="mb-2"><Form.Label>Email</Form.Label><Form.Control {...register('email')} isInvalid={!!errors.email} autoComplete="email" placeholder="you@example.com" /><Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback></Form.Group>
            <Form.Group className="mb-1"><Form.Label>Password</Form.Label>
              <div className="pw-wrap"><Form.Control type={show ? 'text' : 'password'} {...register('password')} isInvalid={!!errors.password} autoComplete="new-password" placeholder="8+ chars, upper + number" /><button type="button" className="pw-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
              <Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
              <div className="strength" aria-hidden>{[0, 1, 2, 3].map((i) => <i key={i} className={i < score ? 'on' : ''} />)}</div>
              <small className="text-secondary">{score <= 2 ? 'Weak' : score === 3 ? 'Good' : 'Strong'} password</small></Form.Group>
            <Button className="w-100 mt-2" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create account →'}</Button>
          </Form>
          <p className="mt-3 mb-0">Have an account? <Link to="/login">Sign in</Link></p>
        </Card>
      </div>
    </div>
  );
}

import { useEffect, useState, type ReactNode } from 'react';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useForm, type FieldErrors, type FieldValues, type Path, type UseFormRegister } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LifeBuoy, Zap, ShieldCheck, BarChart3, Eye, EyeOff, Mail, Lock, User, Loader2, type LucideIcon } from 'lucide-react';
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

function AnimatedIcon({ icon: Icon, delay = 0 }: { icon: LucideIcon; delay?: number }) {
  return <div className="auth-feature-icon-wrapper" style={{ animationDelay: `${delay}ms` }}><Icon size={24} /></div>;
}

function FeatureItem({ icon: Icon, title, description, delay = 0 }: { icon: LucideIcon; title: string; description: string; delay?: number }) {
  return <div className="auth-feat" style={{ animationDelay: `${delay}ms` }}><AnimatedIcon icon={Icon} delay={delay} /><div><strong>{title}</strong><span>{description}</span></div></div>;
}

function StatItem({ label, value, delay = 0 }: { label: string; value: string | number; delay?: number }) {
  return <div className="auth-stat" style={{ animationDelay: `${delay}ms` }}><b>{value}</b><small>{label}</small></div>;
}

function Showcase() {
  return <div className="auth-show"><div className="auth-brand"><span className="brand-badge"><LifeBuoy size={20} /></span> HelpDesk</div><h1>Support that feels <span className="text-primary">instant</span>.</h1><p className="mb-0" style={{ opacity: 0.85 }}>Realtime conversations, SLA tracking and analytics — one workspace for customers, agents and admins.</p><div className="auth-feats"><FeatureItem icon={Zap} title="Realtime tickets." description="Messages, assignment and status sync live." delay={100} /><FeatureItem icon={ShieldCheck} title="SLA you can trust." description="At-risk and breach alerts, enforced server-side." delay={200} /><FeatureItem icon={BarChart3} title="Command-center analytics." description="Volume, SLA compliance, CSAT." delay={300} /></div><div className="auth-stats"><StatItem label="SignalR sync" value="Live" delay={100} /><StatItem label="Role workspaces" value="5" delay={200} /><StatItem label="SLA monitor" value="24/7" delay={300} /></div></div>;
}

function InputWithIcon({ icon: Icon, children, className = '' }: { icon: LucideIcon; children: ReactNode; className?: string }) {
  return <div className={`input-with-icon ${className}`}><span className="input-icon"><Icon size={18} /></span>{children}</div>;
}

function errorMessage<T extends FieldValues>(errors: FieldErrors<T>, name: Path<T>) {
  const message = errors[name]?.message;
  return typeof message === 'string' ? message : undefined;
}

function PasswordField<T extends FieldValues>({ register, errors, show, setShow, name, label, placeholder, autoComplete, icon: Icon }: { register: UseFormRegister<T>; errors: FieldErrors<T>; show: boolean; setShow: (value: boolean) => void; name: Path<T>; label: string; placeholder: string; autoComplete: string; icon: LucideIcon }) {
  const message = errorMessage(errors, name);
  return <Form.Group className="mb-2"><Form.Label>{label}</Form.Label><div className="pw-wrap input-with-icon"><span className="input-icon"><Icon size={18} /></span><Form.Control type={show ? 'text' : 'password'} {...register(name)} isInvalid={!!message} autoComplete={autoComplete} placeholder={placeholder} /><button type="button" className="pw-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button><Form.Control.Feedback type="invalid">{message}</Form.Control.Feedback></div></Form.Group>;
}

function FormField<T extends FieldValues>({ register, errors, name, label, placeholder, type = 'text', icon: Icon, autoComplete, children, ...props }: { register: UseFormRegister<T>; errors: FieldErrors<T>; name: Path<T>; label: string; placeholder: string; type?: string; icon: LucideIcon; autoComplete: string; children?: ReactNode; [key: string]: unknown }) {
  const message = errorMessage(errors, name);
  return <Form.Group className="mb-2"><Form.Label>{label}</Form.Label><InputWithIcon icon={Icon} className={message ? 'has-error' : ''}><Form.Control {...register(name)} type={type} isInvalid={!!message} aria-invalid={!!message} autoComplete={autoComplete} placeholder={placeholder} {...props} /><Form.Control.Feedback type="invalid">{message}</Form.Control.Feedback></InputWithIcon>{children}</Form.Group>;
}

function AuthLayout({ children, title, subtitle, backend, actions }: { children: ReactNode; title: string; subtitle: string; backend: 'checking' | 'live' | 'down'; actions?: ReactNode }) {
  return <Card className="p-4 auth-card"><div className="d-flex justify-content-between align-items-center mb-1"><h2 className="mb-0">{title}</h2><StatusPill status={backend} /></div><p className="text-secondary">{subtitle}</p>{children}{actions}</Card>;
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
        <AuthLayout
          title="Welcome back"
          subtitle="Sign in to your support workspace."
          backend={backend}
          actions={
            <p className="mt-3 mb-0 text-secondary small">Protected by role-based access · JWT rotation</p>
          }
        >
          {err && <Alert variant="danger" role="alert" className="mb-3">{err}</Alert>}
          <Form onSubmit={handleSubmit(async (v) => {
             setErr('');
             try {
               const { data } = await authApi.login(v.email, v.password);
               const me = await authApi.me().catch(() => null);
               setSession(data.accessToken, data.refreshToken, { id: data.userId, email: data.email, fullName: data.fullName, role: me?.data?.role ?? 'Customer' }, v.remember ?? true);
               nav('/dashboard');
             } catch {
               setErr('Invalid email or password.');
             }
          })}>
            <FormField
              register={register}
              errors={errors}
              name="email"
              label="Email"
              placeholder="you@example.com"
               icon={Mail}
               autoComplete="email"
             />
            <PasswordField
              register={register}
              errors={errors}
              show={show}
              setShow={setShow}
              name="password"
              label="Password"
              placeholder="••••••••"
              autoComplete="current-password"
              icon={Lock}
            />
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Form.Check type="checkbox" label="Remember me" {...register('remember')} aria-label="Remember me" />
              <Link to="/register" className="small">Need an account?</Link>
            </div>
            <Button className="w-100" type="submit" disabled={isSubmitting || backend === 'down'}>
              {isSubmitting ? (
                <>
                  <Loader2 width={16} height={16} className="me-2 spin" /> Signing in…
                </>
              ) : (
                'Sign in →'
              )}
            </Button>
            {backend === 'down' && <Alert variant="warning" className="mt-2 py-2 small">Backend unreachable — start the API on :5000, then retry.</Alert>}
           </Form>
         </AuthLayout>
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
        <AuthLayout
          title="Create account"
          subtitle="Join your support workspace in seconds."
          backend={backend}
          actions={
            <p className="mt-3 mb-0">Have an account? <Link to="/login">Sign in</Link></p>
          }
        >
          {err && <Alert variant="danger" role="alert" className="mb-3">{err}</Alert>}
          <Form onSubmit={handleSubmit(async (v) => {
            setErr('');
            try { await authApi.register({ firstName: v.firstName, lastName: v.lastName, email: v.email, password: v.password, organizationSlug: v.organizationSlug || undefined }); nav('/login'); }
            catch { setErr('Registration failed. Email may already exist.'); }
          })}>
            <div className="row">
              <div className="col-6">
                <FormField
                  register={register}
                  errors={errors}
                  name="firstName"
                  label="First name"
                  placeholder="John"
                  icon={User}
                  autoComplete="given-name"
                />
              </div>
              <div className="col-6">
                <FormField
                  register={register}
                  errors={errors}
                  name="lastName"
                  label="Last name"
                  placeholder="Doe"
                  icon={User}
                  autoComplete="family-name"
                />
              </div>
            </div>
            <FormField
              register={register}
              errors={errors}
              name="email"
              label="Email"
              placeholder="you@example.com"
              icon={Mail}
              autoComplete="email"
            />
            <FormField
              register={register}
              errors={errors}
              name="organizationSlug"
              label="Organization slug <span className='text-secondary'>(optional)</span>"
              placeholder="acme"
              icon={ShieldCheck}
              autoComplete="off"
            >
              <Form.Text id="org-help">Join an existing workspace, or leave blank.</Form.Text>
            </FormField>
            <FormField
              register={register}
              errors={errors}
              name="password"
              label="Password"
              placeholder="8+ chars, upper + number"
              type="password"
              icon={Lock}
              autoComplete="new-password"
            >
              <div className="strength" aria-hidden>{[0, 1, 2, 3].map((i) => <i key={i} className={i < score ? 'on' : ''} />)}</div>
              <small className="text-secondary" role="status">{score <= 2 ? 'Weak' : score === 3 ? 'Good' : 'Strong'} password</small>
            </FormField>
            <FormField
              register={register}
              errors={errors}
              name="confirm"
              label="Confirm password"
              placeholder="••••••••"
              type="password"
              icon={Lock}
              autoComplete="new-password"
            />
            <Button className="w-100 mt-2" type="submit" disabled={isSubmitting || backend === 'down'}>
              {isSubmitting ? (
                <>
                  <Loader2 width={16} height={16} className="me-2 spin" /> Creating…
                </>
              ) : (
                'Create account →'
              )}
            </Button>
           </Form>
         </AuthLayout>
      </div>
    </div>
  );
}
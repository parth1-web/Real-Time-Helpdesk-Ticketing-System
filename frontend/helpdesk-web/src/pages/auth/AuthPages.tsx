import { useState } from 'react';
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { authApi } from '../../api/helpdeskApi';
import { useAuthStore } from '../../store/useAuthStore';

const loginSchema = z.object({ email: z.string().email('Please enter a valid email address.'), password: z.string().min(1, 'Password is required.') });
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name required.'),
  lastName: z.string().min(1, 'Last name required.'),
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(8, 'Minimum 8 characters.').regex(/[A-Z]/, 'Needs uppercase.').regex(/[0-9]/, 'Needs a number.'),
});

export function LoginPage() {
  const nav = useNavigate();
  const { setSession } = useAuthStore();
  const [err, setErr] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof loginSchema>>({ resolver: zodResolver(loginSchema) });
  return (
    <Row className="g-0 min-vh-100">
      <Col md={6} className="d-none d-md-flex flex-column justify-content-center p-5 text-white" style={{ background: '#4f46e5' }}>
        <LifeBuoy size={40} /><h1 className="mt-3">Modern support.<br />Faster resolutions.</h1>
        <p>Manage conversations, tickets and SLA from one platform.</p>
      </Col>
      <Col xs={12} md={6} className="d-flex align-items-center justify-content-center p-4">
        <Card className="p-4 w-100" style={{ maxWidth: 420 }}>
          <h3>Login</h3>
          {err && <Alert variant="danger">{err}</Alert>}
          <Form onSubmit={handleSubmit(async (v) => {
            setErr('');
            try {
              const { data } = await authApi.login(v.email, v.password);
              const me = await (await import('../../api/helpdeskApi')).authApi.me().catch(() => null);
              setSession(data.accessToken, data.refreshToken, { id: data.userId, email: data.email, fullName: data.fullName, role: me?.data?.role ?? 'Customer' });
              nav('/dashboard');
            } catch { setErr('Invalid email or password.'); }
          })}>
            <Form.Group className="mb-2"><Form.Label>Email</Form.Label><Form.Control {...register('email')} isInvalid={!!errors.email} aria-invalid={!!errors.email} /><Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Password</Form.Label><Form.Control type="password" {...register('password')} isInvalid={!!errors.password} /><Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback></Form.Group>
            <Button className="w-100" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Login'}</Button>
          </Form>
          <p className="mt-3 mb-0">No account? <Link to="/register">Register</Link></p>
        </Card>
      </Col>
    </Row>
  );
}

export function RegisterPage() {
  const nav = useNavigate();
  const [err, setErr] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<z.infer<typeof registerSchema>>({ resolver: zodResolver(registerSchema) });
  const pw = watch('password', '');
  return (
    <Row className="g-0 min-vh-100">
      <Col md={6} className="d-none d-md-flex flex-column justify-content-center p-5 text-white" style={{ background: '#111827' }}>
        <LifeBuoy size={40} /><h1 className="mt-3">Join your support workspace.</h1><p>Customer → Ticket → Agent → Resolution → Feedback.</p>
      </Col>
      <Col xs={12} md={6} className="d-flex align-items-center justify-content-center p-4">
        <Card className="p-4 w-100" style={{ maxWidth: 460 }}>
          <h3>Register</h3>
          {err && <Alert variant="danger">{err}</Alert>}
          <Form onSubmit={handleSubmit(async (v) => {
            setErr('');
            try { await authApi.register(v); nav('/login'); }
            catch { setErr('Registration failed. Email may already exist.'); }
          })}>
            <Row>
              <Col><Form.Group className="mb-2"><Form.Label>First name</Form.Label><Form.Control {...register('firstName')} isInvalid={!!errors.firstName} /><Form.Control.Feedback type="invalid">{errors.firstName?.message}</Form.Control.Feedback></Form.Group></Col>
              <Col><Form.Group className="mb-2"><Form.Label>Last name</Form.Label><Form.Control {...register('lastName')} isInvalid={!!errors.lastName} /><Form.Control.Feedback type="invalid">{errors.lastName?.message}</Form.Control.Feedback></Form.Group></Col>
            </Row>
            <Form.Group className="mb-2"><Form.Label>Email</Form.Label><Form.Control {...register('email')} isInvalid={!!errors.email} /><Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback></Form.Group>
            <Form.Group className="mb-2"><Form.Label>Password</Form.Label><Form.Control type="password" {...register('password')} isInvalid={!!errors.password} /><Form.Control.Feedback type="invalid">{errors.password?.message}</Form.Control.Feedback>
              <small className="text-secondary">✓ {pw.length >= 8 ? '✔' : '✗'} length · ✓ {/[A-Z]/.test(pw) ? '✔' : '✗'} uppercase · ✓ {/[0-9]/.test(pw) ? '✔' : '✗'} number</small></Form.Group>
            <Button className="w-100" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create account'}</Button>
          </Form>
          <p className="mt-3 mb-0">Have an account? <Link to="/login">Login</Link></p>
        </Card>
      </Col>
    </Row>
  );
}

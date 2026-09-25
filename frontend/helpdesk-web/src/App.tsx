import 'bootstrap/dist/css/bootstrap.min.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Navbar, Nav, Spinner, Alert, Badge, Button, Card, Table, Form } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { ticketApi } from './api/axiosClient';
export { Container, Navbar, Nav, Spinner, Alert, Badge, Button, Card, Table, Form };
const qc = new QueryClient();
function Protected({ children }: { children: JSX.Element }) {
  const t = localStorage.getItem('accessToken');
  return t ? children : <Navigate to="/login" />;
}
function Login() {
  return (<Container className="py-5"><Card className="p-4 mx-auto" style={{ maxWidth: 420 }}><h3>Helpdesk Login</h3><Form><Form.Group className="mb-2"><Form.Label>Email</Form.Label><Form.Control name="email" /></Form.Group><Form.Group className="mb-3"><Form.Label>Password</Form.Label><Form.Control type="password" name="password" /></Form.Group><Button type="submit">Login</Button></Form></Card></Container>);
}
function Dashboard() {
  const { data, isLoading, isError } = useQuery({ queryKey: ['summary'], queryFn: async () => (await ticketApi.summary()).data });
  if (isLoading) return <Container className="py-4"><Spinner animation="border" /></Container>;
  if (isError) return <Container className="py-4"><Alert variant="danger">Unable to load tickets. <Button size="sm">Try Again</Button></Alert></Container>;
  if (!data || data.total === 0) return <Container className="py-4"><Alert variant="info">No support tickets yet. Need help? Create Your First Ticket</Alert></Container>;
  return (<Container className="py-4"><h3>Dashboard</h3><p>Total: {data.total} Open: {data.open} Resolved: {data.resolved}</p></Container>);
}
export default function App() {
  return (<QueryClientProvider client={qc}><BrowserRouter><Navbar bg="dark" variant="dark" expand="lg" sticky="top"><Container><Navbar.Brand>Helpdesk</Navbar.Brand><Nav><Nav.Link href="/dashboard">Dashboard</Nav.Link><Nav.Link href="/tickets">Tickets</Nav.Link><Nav.Link href="/agent/tickets">Queue</Nav.Link><Nav.Link href="/admin/dashboard">Admin</Nav.Link></Nav></Container></Navbar><Routes><Route path="/login" element={<Login />} /><Route path="/dashboard" element={<Protected><Dashboard /></Protected>} /><Route path="*" element={<Navigate to="/dashboard" />} /></Routes></BrowserRouter></QueryClientProvider>);
}

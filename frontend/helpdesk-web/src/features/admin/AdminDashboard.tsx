import { Container, Card, Row, Col } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { ticketApi } from '../../api/axiosClient';

export function AdminDashboard() {
  const { data } = useQuery({ queryKey: ['summary'], queryFn: async () => (await ticketApi.summary()).data });
  const byStatus = data?.byStatus ?? [];
  const byPriority = data?.byPriority ?? [];
  return (<Container className="py-4"><h4>Admin Dashboard</h4><Row><Col md={4}><Card className="p-3">Total: {data?.total ?? 0} Open: {data?.open ?? 0} Resolved: {data?.resolved ?? 0} CSAT: {Number(data?.avgRating ?? 0).toFixed(1)}</Card></Col><Col md={4}><Card className="p-3"><h6>Tickets by Status</h6><BarChart width={280} height={180} data={byStatus}><XAxis dataKey="status" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#4f46e5" /></BarChart></Card></Col><Col md={4}><Card className="p-3"><h6>Tickets by Priority</h6><PieChart width={280} height={180}><Pie data={byPriority} dataKey="count" nameKey="priority" outerRadius={60}>{byPriority.map((_: any, i: number) => (<Cell key={i} fill={['#6b7280', '#3b82f6', '#f59e0b', '#ef4444'][i % 4]} />))}</Pie><Tooltip /></PieChart></Card></Col></Row><Row className="mt-3"><Col><Card className="p-3"><h6>Tickets Created Over Time</h6><LineChart width={600} height={200} data={[{ d: 'Mon', v: 12 }, { d: 'Tue', v: 19 }, { d: 'Wed', v: 8 }]}><XAxis dataKey="d" /><YAxis /><Tooltip /><Line dataKey="v" stroke="#4f46e5" /></LineChart></Card></Col></Row></Container>);
}
export function FeedbackForm({ onSubmit }: { onSubmit: (r: number, c: string) => void }) {
  return (<Card className="p-4 text-center"><h5>How was your support experience?</h5><div className="fs-3">☆ ☆ ☆ ☆ ☆</div><input className="form-control my-2" placeholder="Tell us more" id="fb" /><button className="btn btn-primary" onClick={() => onSubmit(5, (document.getElementById('fb') as HTMLInputElement)?.value ?? '')}>Submit Feedback</button></Card>);
}

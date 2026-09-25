import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { useAuthStore } from '../store/useAuthStore';
import { getToken } from '../store/session';

type LiveState = 'live' | 'connecting' | 'offline';
const LiveCtx = createContext<LiveState>('connecting');
export const useLive = () => useContext(LiveCtx);

function toast(title: string, body: string) {
  window.dispatchEvent(new CustomEvent('helpdesk:toast', { detail: { title, body } }));
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [state, setState] = useState<LiveState>('connecting');

  useEffect(() => {
    const token = getToken() ?? '';
    if (!token) { setState('offline'); return; }
    let disposed = false;
    const mk = (url: string) =>
      new HubConnectionBuilder().withUrl(url, { accessTokenFactory: () => getToken() ?? '' }).withAutomaticReconnect().build();
    const tickets = mk('/hubs/tickets');
    const notifs = mk('/hubs/notifications');
    const on = (c: HubConnection) => {
      c.onreconnecting(() => !disposed && setState('connecting'));
      c.onreconnected(async () => {
        if (disposed) return;
        setState('live');
        try { if (user?.organizationId) { await c.invoke('JoinOrganization', user.organizationId); } } catch { /* noop */ }
      });
      c.onclose(() => !disposed && setState('offline'));
    };
    on(tickets); on(notifs);
    const invalidate = (keys: string[][]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    tickets.on('TicketMessageAdded', () => { invalidate([['msgs'], ['tickets'], ['queue']]); });
    tickets.on('TicketStatusChanged', () => { invalidate([['ticket'], ['msgs'], ['tickets'], ['activity']]); });
    tickets.on('TicketAssigned', (p: { ticketId: string }) => { invalidate([['ticket'], ['tickets']]); toast('New ticket assignment', `Ticket ${p?.ticketId ?? ''} was assigned.`); });
    tickets.on('TicketPriorityChanged', () => invalidate([['ticket'], ['tickets']]));
    notifs.on('SlaAtRisk', () => { invalidate([['tickets'], ['summary']]); toast('SLA warning', 'A ticket is approaching its deadline.'); });
    notifs.on('SlaBreached', () => { invalidate([['tickets'], ['summary']]); toast('SLA breached', 'A ticket missed its deadline.'); });
    (async () => {
      try {
        await Promise.all([tickets.start(), notifs.start()]);
        if (disposed) return;
        setState('live');
        if (user?.organizationId) {
          await tickets.invoke('JoinOrganization', user.organizationId).catch(() => undefined);
        }
      } catch { if (!disposed) setState('offline'); }
    })();
    return () => { disposed = true; tickets.stop().catch(() => undefined); notifs.stop().catch(() => undefined); };
  }, [qc, user?.organizationId]);

  useEffect(() => {
    const on = () => setState((s) => (navigator.onLine ? s : 'offline'));
    window.addEventListener('offline', on);
    window.addEventListener('online', on);
    return () => { window.removeEventListener('offline', on); window.removeEventListener('online', on); };
  }, []);

  return <LiveCtx.Provider value={state}>{children}</LiveCtx.Provider>;
}
export { HubConnectionState };

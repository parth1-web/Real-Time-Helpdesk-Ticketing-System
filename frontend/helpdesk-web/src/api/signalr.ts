import * as signalR from '@microsoft/signalr';
export function createTicketConnection(token: string) {
  return new signalR.HubConnectionBuilder()
    .withUrl('/hubs/tickets', { accessTokenFactory: () => token })
    .withAutomaticReconnect()
    .build();
}
export function createNotificationConnection(token: string) {
  return new signalR.HubConnectionBuilder()
    .withUrl('/hubs/notifications', { accessTokenFactory: () => token })
    .withAutomaticReconnect()
    .build();
}

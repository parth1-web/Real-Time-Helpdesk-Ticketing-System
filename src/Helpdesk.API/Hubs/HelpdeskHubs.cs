using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Helpdesk.API.Hubs;

[Authorize]
public class TicketHub : Hub
{
    public async Task JoinTicket(string ticketId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"ticket:{ticketId}");
    public async Task LeaveTicket(string ticketId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"ticket:{ticketId}");
    public async Task JoinOrganization(string orgId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"organization:{orgId}");
    public override async Task OnConnectedAsync()
    {
        var user = Context.User?.FindFirstValue("sub") ?? Context.UserIdentifier;
        if (user != null) await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{user}");
        await base.OnConnectedAsync();
    }
}

[Authorize]
public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var org = Context.User?.FindFirst("org")?.Value;
        if (org != null) await Groups.AddToGroupAsync(Context.ConnectionId, $"organization:{org}");
        var sub = Context.User?.FindFirstValue("sub") ?? Context.UserIdentifier;
        if (sub != null) await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{sub}");
        await base.OnConnectedAsync();
    }
}

namespace Helpdesk.Domain.Enums;

public enum TicketStatus { Open = 0, InProgress = 1, WaitingForCustomer = 2, Resolved = 3, Closed = 4 }
public enum TicketPriority { Low = 0, Medium = 1, High = 2, Urgent = 3 }
public enum UserRole { SuperAdmin = 0, OrganizationAdmin = 1, SupportManager = 2, SupportAgent = 3, Customer = 4 }
public enum SlaStatus { OnTrack = 0, AtRisk = 1, Breached = 2 }
public enum NotificationType
{
    TicketCreated = 0, TicketAssigned = 1, TicketReassigned = 2, NewMessage = 3,
    Mention = 4, StatusChanged = 5, PriorityChanged = 6, SlaAtRisk = 7,
    SlaBreached = 8, TicketResolved = 9, TicketClosed = 10
}
public static class TicketTransitions
{
    private static readonly Dictionary<TicketStatus, TicketStatus[]> Allowed = new()
    {
        [TicketStatus.Open] = new[] { TicketStatus.InProgress, TicketStatus.Closed },
        [TicketStatus.InProgress] = new[] { TicketStatus.WaitingForCustomer, TicketStatus.Resolved, TicketStatus.Open },
        [TicketStatus.WaitingForCustomer] = new[] { TicketStatus.InProgress, TicketStatus.Resolved },
        [TicketStatus.Resolved] = new[] { TicketStatus.Closed, TicketStatus.InProgress },
        [TicketStatus.Closed] = new[] { TicketStatus.InProgress },
    };
    public static bool CanTransition(TicketStatus from, TicketStatus to)
        => Allowed.TryGetValue(from, out var next) && next.Contains(to);
}

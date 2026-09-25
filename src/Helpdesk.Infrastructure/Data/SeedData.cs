using Helpdesk.Domain.Entities;
using Helpdesk.Domain.Enums;
using Helpdesk.Infrastructure.Authentication;
using Microsoft.EntityFrameworkCore;

namespace Helpdesk.Infrastructure.Data;

public static class SeedData
{
    public static async Task SeedAsync(ApplicationDbContext db)
    {
        if (!await db.Organizations.AnyAsync())
        {
            var org = new Organization { Name = "Acme Support", Slug = "acme", Description = "Demo organization" };
            db.Organizations.Add(org);

            var billing = new Department { Organization = org, Name = "Billing", Description = "Billing & payments" };
            var tech = new Department { Organization = org, Name = "Technical Support", Description = "Product & bugs" };
            db.Departments.AddRange(billing, tech);

            var cat1 = new TicketCategory { Organization = org, Name = "Payment Issue" };
            var cat2 = new TicketCategory { Organization = org, Name = "Bug Report" };
            db.TicketCategories.AddRange(cat1, cat2);

            db.SlaPolicies.AddRange(
                new SlaPolicy { Organization = org, Name = "Urgent SLA", Priority = TicketPriority.Urgent, FirstResponseMinutes = 15, ResolutionMinutes = 240 },
                new SlaPolicy { Organization = org, Name = "High SLA", Priority = TicketPriority.High, FirstResponseMinutes = 30, ResolutionMinutes = 480 },
                new SlaPolicy { Organization = org, Name = "Medium SLA", Priority = TicketPriority.Medium, FirstResponseMinutes = 120, ResolutionMinutes = 1440 },
                new SlaPolicy { Organization = org, Name = "Low SLA", Priority = TicketPriority.Low, FirstResponseMinutes = 480, ResolutionMinutes = 4320 }
            );
            await db.SaveChangesAsync();
        }

        await SeedDemoAsync(db);
    }

    /// <summary>Demo workspace: one user per role + tickets in every status. Idempotent.</summary>
    private static async Task SeedDemoAsync(ApplicationDbContext db)
    {
        var org = await db.Organizations.FirstOrDefaultAsync();
        if (org == null) return;
        if (await db.Users.AnyAsync(u => u.Email == "customer@demo.local")) return;

        User Mk(string fn, string ln, string email, UserRole role)
        {
            var u = new User { FirstName = fn, LastName = ln, Email = email, PasswordHash = PasswordHasher.Hash("Demo123!") };
            db.Users.Add(u);
            db.OrganizationMembers.Add(new OrganizationMember { OrganizationId = org.Id, UserId = u.Id, Role = role });
            return u;
        }

        var admin = Mk("Asha", "Admin", "admin@demo.local", UserRole.OrganizationAdmin);
        var manager = Mk("Milan", "Manager", "manager@demo.local", UserRole.SupportManager);
        var agent = Mk("Alex", "Smith", "agent@demo.local", UserRole.SupportAgent);
        var customer = Mk("John", "Doe", "customer@demo.local", UserRole.Customer);
        var customer2 = Mk("Sara", "Lee", "sara@demo.local", UserRole.Customer);
        await db.SaveChangesAsync();

        var billing = await db.Departments.FirstAsync(d => d.OrganizationId == org.Id);
        var payCat = await db.TicketCategories.FirstAsync(c => c.OrganizationId == org.Id);
        var now = DateTime.UtcNow;

        Ticket MkTicket(string no, string subject, string desc, TicketPriority pr, TicketStatus st, User by, int hoursAgo, DateTime? due)
        {
            var t = new Ticket
            {
                OrganizationId = org.Id, TicketNumber = no, Subject = subject, Description = desc,
                Priority = pr, Status = st, CategoryId = payCat.Id, DepartmentId = billing.Id,
                CreatedBy = by.Id, CreatedAt = now.AddHours(-hoursAgo), UpdatedAt = now.AddHours(-hoursAgo),
                DueAt = due,
            };
            if (st == TicketStatus.Resolved || st == TicketStatus.Closed) t.ResolvedAt = now.AddHours(-hoursAgo + 1);
            if (st == TicketStatus.Closed) t.ClosedAt = now.AddHours(-hoursAgo + 2);
            db.Tickets.Add(t);
            return t;
        }

        var t1 = MkTicket("TCK-100001", "Payment failed at checkout", "Card charged twice on order #9918.", TicketPriority.Urgent, TicketStatus.Open, customer, 1, now.AddHours(3));
        var t2 = MkTicket("TCK-100002", "Cannot log in", "Password reset email never arrives.", TicketPriority.High, TicketStatus.InProgress, customer, 5, now.AddHours(3));
        var t3 = MkTicket("TCK-100003", "Invoice download broken", "PDF export spins forever.", TicketPriority.Medium, TicketStatus.WaitingForCustomer, customer2, 26, now.AddHours(20));
        var t4 = MkTicket("TCK-100004", "Refund not received", "Refund approved 10 days ago.", TicketPriority.High, TicketStatus.Resolved, customer, 50, now.AddHours(-2));
        var t5 = MkTicket("TCK-100005", "Change billing email", "Please update billing contact.", TicketPriority.Low, TicketStatus.Closed, customer2, 100, now.AddHours(-28));
        await db.SaveChangesAsync();

        db.TicketMessages.AddRange(
            new TicketMessage { TicketId = t1.Id, SenderId = customer.Id, Message = "I was charged twice, please help!", CreatedAt = now.AddMinutes(-50) },
            new TicketMessage { TicketId = t2.Id, SenderId = customer.Id, Message = "Still locked out.", CreatedAt = now.AddHours(-4) },
            new TicketMessage { TicketId = t2.Id, SenderId = agent.Id, Message = "Looking into your account now.", CreatedAt = now.AddHours(-3) },
            new TicketMessage { TicketId = t2.Id, SenderId = agent.Id, Message = "Customer seems to use an old email alias.", IsInternal = true, CreatedAt = now.AddHours(-3) },
            new TicketMessage { TicketId = t3.Id, SenderId = agent.Id, Message = "Could you try a different browser?", CreatedAt = now.AddHours(-20) }
        );

        db.TicketAssignments.Add(new TicketAssignment { TicketId = t2.Id, AgentId = agent.Id, AssignedBy = manager.Id });
        t2.AssignedTo = agent.Id;
        t2.FirstResponseAt = now.AddHours(-3);

        db.Notifications.Add(new Notification { UserId = agent.Id, Type = NotificationType.TicketAssigned, Title = $"Assigned {t2.TicketNumber}", Message = t2.Subject });

        db.Feedbacks.Add(new CustomerFeedback { TicketId = t4.Id, CustomerId = customer.Id, Rating = 5, Comment = "Fast and friendly, thank you!" });

        db.ActivityLogs.Add(new ActivityLog { OrganizationId = org.Id, UserId = customer.Id, TicketId = t1.Id, Action = "Ticket created", EntityType = "Ticket", EntityId = t1.Id.ToString(), Description = t1.Subject });
        await db.SaveChangesAsync();
    }
}

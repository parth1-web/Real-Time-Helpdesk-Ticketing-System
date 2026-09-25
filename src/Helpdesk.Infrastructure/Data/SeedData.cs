using Helpdesk.Domain.Entities;
using Helpdesk.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Helpdesk.Infrastructure.Data;

public static class SeedData
{
    public static async Task SeedAsync(ApplicationDbContext db)
    {
        if (await db.Organizations.AnyAsync()) return;

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
}

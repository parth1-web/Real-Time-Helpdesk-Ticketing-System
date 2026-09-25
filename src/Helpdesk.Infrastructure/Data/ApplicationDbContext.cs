using Helpdesk.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Helpdesk.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrganizationMember> OrganizationMembers => Set<OrganizationMember>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<TicketCategory> TicketCategories => Set<TicketCategory>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<TicketMessage> TicketMessages => Set<TicketMessage>();
    public DbSet<TicketAttachment> TicketAttachments => Set<TicketAttachment>();
    public DbSet<TicketAssignment> TicketAssignments => Set<TicketAssignment>();
    public DbSet<SlaPolicy> SlaPolicies => Set<SlaPolicy>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<CustomerFeedback> Feedbacks => Set<CustomerFeedback>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        b.Entity<User>().HasIndex(u => u.Email).IsUnique();
        b.Entity<Organization>().HasIndex(o => o.Slug).IsUnique();
        b.Entity<OrganizationMember>().HasIndex(m => new { m.OrganizationId, m.UserId }).IsUnique();
        b.Entity<Ticket>().HasIndex(t => t.OrganizationId);
        b.Entity<Ticket>().HasIndex(t => t.Status);
        b.Entity<Ticket>().HasIndex(t => t.Priority);
        b.Entity<Ticket>().HasIndex(t => t.AssignedTo);
        b.Entity<Ticket>().HasIndex(t => t.DepartmentId);
        b.Entity<Ticket>().HasIndex(t => t.CreatedAt);
        b.Entity<Ticket>().HasIndex(t => t.TicketNumber).IsUnique();
        b.Entity<TicketMessage>().HasIndex(m => m.TicketId);
        b.Entity<Notification>().HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt });
        b.Entity<ActivityLog>().HasIndex(a => new { a.OrganizationId, a.CreatedAt });
        b.Entity<RefreshToken>().HasIndex(r => r.TokenHash).IsUnique();

        // Prevent cascade wipe of history
        b.Entity<Ticket>().HasOne(t => t.Creator).WithMany().HasForeignKey(t => t.CreatedBy).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Ticket>().HasOne(t => t.Assignee).WithMany().HasForeignKey(t => t.AssignedTo).OnDelete(DeleteBehavior.SetNull);
        b.Entity<TicketMessage>().HasOne(m => m.Ticket).WithMany(t => t.Messages).HasForeignKey(m => m.TicketId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<TicketAssignment>().HasOne(a => a.Ticket).WithMany(t => t.Assignments).HasForeignKey(a => a.TicketId).OnDelete(DeleteBehavior.Cascade);
    }
}

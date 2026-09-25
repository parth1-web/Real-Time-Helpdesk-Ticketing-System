using Helpdesk.Domain.Enums;
using Helpdesk.Infrastructure.Authentication;
using Helpdesk.Infrastructure.Services;

namespace Helpdesk.UnitTests;

public class TicketTransitionTests
{
    [Theory]
    [InlineData(TicketStatus.Open, TicketStatus.InProgress, true)]
    [InlineData(TicketStatus.Open, TicketStatus.Resolved, false)]
    [InlineData(TicketStatus.InProgress, TicketStatus.WaitingForCustomer, true)]
    [InlineData(TicketStatus.Resolved, TicketStatus.Closed, true)]
    [InlineData(TicketStatus.Closed, TicketStatus.Open, false)]
    public void Transitions_Validate(TicketStatus from, TicketStatus to, bool expected)
        => Assert.Equal(expected, TicketTransitions.CanTransition(from, to));
}

public class SlaTests
{
    [Fact]
    public void Computes_OnTrack_AtRisk_Breached()
    {
        var s = new SlaService();
        var created = DateTime.UtcNow.AddHours(-1);
        Assert.Equal("OnTrack", s.ComputeStatus(DateTime.UtcNow.AddHours(5), created, 360));
        Assert.Equal("AtRisk", s.ComputeStatus(DateTime.UtcNow.AddMinutes(5), created, 360));
        Assert.Equal("Breached", s.ComputeStatus(DateTime.UtcNow.AddMinutes(-5), created, 360));
    }
    [Fact]
    public void Calculates_Deadlines()
    {
        var s = new SlaService();
        var now = DateTime.UtcNow;
        var (fr, res) = s.CalculateDeadlines(now, 15, 240);
        Assert.Equal(now.AddMinutes(15), fr, TimeSpan.FromSeconds(1));
        Assert.Equal(now.AddMinutes(240), res, TimeSpan.FromSeconds(1));
    }
}

public class PasswordTests
{
    [Fact]
    public void Hash_Verify_Roundtrip()
    {
        var h = PasswordHasher.Hash("Secret123!");
        Assert.True(PasswordHasher.Verify("Secret123!", h));
        Assert.False(PasswordHasher.Verify("Wrong", h));
    }
}

public class ValidatorTests
{
    [Fact]
    public void Register_Rejects_BadEmail()
    {
        var v = new Helpdesk.Application.Validators.RegisterValidator();
        var r = v.Validate(new Helpdesk.Application.DTOs.RegisterRequest("", "", "bad", "short"));
        Assert.False(r.IsValid);
    }
}

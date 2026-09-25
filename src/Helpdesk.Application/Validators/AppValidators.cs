using FluentValidation;
using Helpdesk.Application.DTOs;

namespace Helpdesk.Application.Validators;

public class RegisterValidator : AbstractValidator<RegisterRequest>
{
    public RegisterValidator()
    {
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(100);
    }
}
public class LoginValidator : AbstractValidator<LoginRequest>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}
public class TicketCreateValidator : AbstractValidator<TicketCreateRequest>
{
    public TicketCreateValidator()
    {
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(5000);
        RuleFor(x => x.Priority).Must(p => new[] { "Low", "Medium", "High", "Urgent" }.Contains(p)).WithMessage("Invalid priority");
        RuleFor(x => x.OrganizationId).NotEmpty();
    }
}
public class MessageCreateValidator : AbstractValidator<MessageCreateRequest>
{
    public MessageCreateValidator()
    {
        RuleFor(x => x.Message).NotEmpty().MaximumLength(5000);
    }
}

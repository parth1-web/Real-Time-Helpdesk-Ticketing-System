using System.Text;
using FluentValidation;
using Helpdesk.API.Hubs;
using Helpdesk.Application.Interfaces;
using Helpdesk.Application.Validators;
using Helpdesk.Infrastructure.Authentication;
using Helpdesk.Infrastructure.Background;
using Helpdesk.Infrastructure.Cache;
using Helpdesk.Infrastructure.Data;
using Helpdesk.Infrastructure.Notifications;
using Helpdesk.Infrastructure.Services;
using Helpdesk.Infrastructure.Storage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

Log.Logger = new LoggerConfiguration().WriteTo.Console().CreateLogger();
builder.Host.UseSerilog();

var conn = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(conn))
    throw new InvalidOperationException("ConnectionStrings:Default is required. Configure it in an ignored appsettings.json or environment variables.");
builder.Services.AddDbContext<ApplicationDbContext>(o => o.UseNpgsql(conn));

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("Jwt:Key must be configured with at least 32 characters.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "Helpdesk",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "HelpdeskClients",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(2)
        };
        o.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) && ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                    ctx.Token = token;
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Helpdesk API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header, Name = "Authorization", Type = SecuritySchemeType.Http, Scheme = "bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
    });
});

builder.Services.AddValidatorsFromAssemblyContaining<RegisterValidator>();
builder.Services.AddScoped<IJwtService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITicketService, TicketService>();
builder.Services.AddScoped<ISlaService, SlaService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IActivityService, ActivityService>();
builder.Services.AddSingleton<ICacheService, MemoryCacheService>();
builder.Services.AddSingleton<IEmailService, LogEmailService>();
builder.Services.AddScoped<IAttachmentStorage, LocalAttachmentStorage>();
builder.Services.AddHostedService<SlaMonitorService>();

builder.Services.AddCors(o => o.AddPolicy("web", p => p
    .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? new[] { "http://localhost:5173" })
    .AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

builder.Services.AddRateLimiter(o =>
{
    o.AddFixedWindowLimiter("auth", x => { x.PermitLimit = 10; x.Window = TimeSpan.FromMinutes(1); });
    o.AddFixedWindowLimiter("write", x => { x.PermitLimit = 60; x.Window = TimeSpan.FromMinutes(1); });
});

var app = builder.Build();
app.UseSerilogRequestLogging();
if (app.Environment.IsDevelopment()) { app.UseSwagger(); app.UseSwaggerUI(); }
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors("web");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers().RequireRateLimiting("write");
app.MapHub<TicketHub>("/hubs/tickets");
app.MapHub<NotificationHub>("/hubs/notifications");
app.MapFallbackToFile("/index.html");

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        if (conn.Contains("Host=")) { await db.Database.MigrateAsync(); await SeedData.SeedAsync(db); }
    }
    catch (Exception ex) { Log.Warning(ex, "DB migrate/seed skipped (configure PostgreSQL to enable)."); }
}

app.Run();
public partial class Program { }

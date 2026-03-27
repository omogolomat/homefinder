using FindBW.Application.Abstractions;
using FindBW.Application.DTOs.Auth;
using FindBW.Domain.Entities;
using FindBW.Domain.Enums;
using FindBW.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FindBW.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly FindBwDbContext _db;
    private readonly IJwtTokenGenerator _jwt;

    public AuthService(FindBwDbContext db, IJwtTokenGenerator jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var normalized = request.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email == normalized, cancellationToken))
            return null;

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = normalized,
            PhoneNumber = request.PhoneNumber.Trim(),
            FullName = request.FullName.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password, workFactor: 11),
            // Public registration is buyers/renters only — agents are admitted by FindBW staff.
            Role = UserRole.Buyer,
            WhatsAppOptIn = request.WhatsAppOptIn,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(cancellationToken);

        return ToResponse(user);
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var normalized = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == normalized, cancellationToken);
        if (user is null)
            return null;

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        return ToResponse(user);
    }

    private AuthResponse ToResponse(User user)
    {
        var (token, expires) = _jwt.CreateAccessToken(user);
        return new AuthResponse
        {
            AccessToken = token,
            ExpiresAtUtc = expires,
            UserId = user.Id,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            FullName = user.FullName,
            Role = user.Role.ToString()
        };
    }
}

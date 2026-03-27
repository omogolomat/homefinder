using FindBW.Domain.Entities;

namespace FindBW.Application.Abstractions;

public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiresAtUtc) CreateAccessToken(User user);
}

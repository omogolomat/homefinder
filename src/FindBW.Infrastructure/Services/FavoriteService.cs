using FindBW.Application.Abstractions;
using FindBW.Domain.Entities;
using FindBW.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FindBW.Infrastructure.Services;

public class FavoriteService : IFavoriteService
{
    private readonly FindBwDbContext _db;

    public FavoriteService(FindBwDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<Guid>> GetListingIdsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _db.Favorites
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CreatedAtUtc)
            .Select(f => f.ListingId)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> AddAsync(Guid userId, Guid listingId, CancellationToken cancellationToken = default)
    {
        if (!await _db.Listings.AnyAsync(l => l.Id == listingId, cancellationToken))
            return false;

        if (await _db.Favorites.AnyAsync(f => f.UserId == userId && f.ListingId == listingId, cancellationToken))
            return true;

        _db.Favorites.Add(new Favorite
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ListingId = listingId,
            CreatedAtUtc = DateTime.UtcNow
        });

        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RemoveAsync(Guid userId, Guid listingId, CancellationToken cancellationToken = default)
    {
        var fav = await _db.Favorites.FirstOrDefaultAsync(f => f.UserId == userId && f.ListingId == listingId, cancellationToken);
        if (fav is null)
            return false;

        _db.Favorites.Remove(fav);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}

namespace FindBW.Application.Abstractions;

public interface IFavoriteService
{
    Task<IReadOnlyList<Guid>> GetListingIdsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> AddAsync(Guid userId, Guid listingId, CancellationToken cancellationToken = default);
    Task<bool> RemoveAsync(Guid userId, Guid listingId, CancellationToken cancellationToken = default);
}

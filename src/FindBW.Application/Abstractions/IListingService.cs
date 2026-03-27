using FindBW.Application.DTOs.Listings;

namespace FindBW.Application.Abstractions;

public interface IListingService
{
    Task<PagedResult<ListingSummaryDto>> SearchAsync(SearchListingsQuery query, CancellationToken cancellationToken = default);
    Task<ListingDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Guid?> CreateAsync(Guid agentId, CreateListingRequest request, CancellationToken cancellationToken = default);
}

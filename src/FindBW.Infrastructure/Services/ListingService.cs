using FindBW.Application.Abstractions;
using FindBW.Application.DTOs.Listings;
using FindBW.Domain.Entities;
using FindBW.Domain.Enums;
using FindBW.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FindBW.Infrastructure.Services;

public class ListingService : IListingService
{
    private readonly FindBwDbContext _db;

    public ListingService(FindBwDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<ListingSummaryDto>> SearchAsync(SearchListingsQuery query, CancellationToken cancellationToken = default)
    {
        var q = _db.Listings
            .AsNoTracking()
            .Where(l => l.Status == ListingStatus.Active);

        if (query.City.HasValue)
            q = q.Where(l => l.City == query.City.Value);

        if (query.ListingType.HasValue)
            q = q.Where(l => l.ListingType == query.ListingType.Value);

        if (query.PropertyType.HasValue)
            q = q.Where(l => l.PropertyType == query.PropertyType.Value);

        if (query.MinPrice.HasValue)
            q = q.Where(l => l.PriceBwp >= query.MinPrice.Value);

        if (query.MaxPrice.HasValue)
            q = q.Where(l => l.PriceBwp <= query.MaxPrice.Value);

        if (!string.IsNullOrWhiteSpace(query.Q))
        {
            var term = query.Q.Trim();
            q = q.Where(l =>
                l.Title.Contains(term) ||
                l.Suburb.Contains(term));
        }

        var total = await q.CountAsync(cancellationToken);
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 48);

        var rows = await q
            .OrderByDescending(l => l.IsFeatured)
            .ThenByDescending(l => l.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new
            {
                l.Id,
                l.Title,
                l.PriceBwp,
                l.ListingType,
                l.PropertyType,
                l.City,
                l.Suburb,
                l.Bedrooms,
                l.IsFeatured,
                PrimaryUrl = l.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        var items = rows.Select(l => new ListingSummaryDto
        {
            Id = l.Id,
            Title = l.Title,
            PriceBwp = l.PriceBwp,
            ListingType = l.ListingType,
            PropertyType = l.PropertyType,
            City = l.City,
            Suburb = l.Suburb,
            Bedrooms = l.Bedrooms,
            PrimaryImageUrl = l.PrimaryUrl,
            IsFeatured = l.IsFeatured
        }).ToList();

        return new PagedResult<ListingSummaryDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<ListingDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var listing = await _db.Listings
            .AsNoTracking()
            .Include(l => l.Agent)
            .Include(l => l.Images.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);

        if (listing is null)
            return null;

        return new ListingDetailDto
        {
            Id = listing.Id,
            Title = listing.Title,
            Description = listing.Description,
            PriceBwp = listing.PriceBwp,
            ListingType = listing.ListingType,
            Status = listing.Status,
            PropertyType = listing.PropertyType,
            City = listing.City,
            Suburb = listing.Suburb,
            Bedrooms = listing.Bedrooms,
            Bathrooms = listing.Bathrooms,
            Latitude = listing.Latitude,
            Longitude = listing.Longitude,
            IsFeatured = listing.IsFeatured,
            AgentName = listing.Agent.FullName,
            AgentPhone = listing.Agent.PhoneNumber,
            ImageUrls = listing.Images.Select(i => i.Url).ToList()
        };
    }

    public async Task<Guid?> CreateAsync(Guid agentId, CreateListingRequest request, CancellationToken cancellationToken = default)
    {
        var listing = new Listing
        {
            Id = Guid.NewGuid(),
            AgentId = agentId,
            Title = request.Title.Trim(),
            Description = request.Description,
            PriceBwp = request.PriceBwp,
            ListingType = request.ListingType,
            Status = ListingStatus.Active,
            PropertyType = request.PropertyType,
            City = request.City,
            Suburb = request.Suburb.Trim(),
            Bedrooms = request.Bedrooms,
            Bathrooms = request.Bathrooms,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            CreatedAtUtc = DateTime.UtcNow
        };

        var order = 0;
        foreach (var url in request.ImageUrls)
        {
            if (string.IsNullOrWhiteSpace(url))
                continue;
            listing.Images.Add(new ListingImage
            {
                Id = Guid.NewGuid(),
                ListingId = listing.Id,
                Url = url.Trim(),
                SortOrder = order,
                IsPrimary = order == 0
            });
            order++;
        }

        _db.Listings.Add(listing);
        await _db.SaveChangesAsync(cancellationToken);
        return listing.Id;
    }
}

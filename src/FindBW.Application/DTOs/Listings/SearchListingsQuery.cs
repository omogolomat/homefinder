using FindBW.Domain.Enums;

namespace FindBW.Application.DTOs.Listings;

public class SearchListingsQuery
{
    public string? Q { get; set; }
    public BotswanaCity? City { get; set; }
    public ListingType? ListingType { get; set; }
    public PropertyType? PropertyType { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 12;
}

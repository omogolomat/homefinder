using FindBW.Domain.Enums;

namespace FindBW.Application.DTOs.Listings;

public class CreateListingRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal PriceBwp { get; set; }
    public ListingType ListingType { get; set; }
    public PropertyType PropertyType { get; set; }
    public BotswanaCity City { get; set; }
    public string Suburb { get; set; } = string.Empty;
    public int? Bedrooms { get; set; }
    public int? Bathrooms { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public IReadOnlyList<string> ImageUrls { get; set; } = Array.Empty<string>();
}

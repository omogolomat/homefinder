using FindBW.Domain.Enums;

namespace FindBW.Application.DTOs.Listings;

public class ListingSummaryDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public decimal PriceBwp { get; set; }
    public ListingType ListingType { get; set; }
    public PropertyType PropertyType { get; set; }
    public BotswanaCity City { get; set; }
    public string Suburb { get; set; } = string.Empty;
    public int? Bedrooms { get; set; }
    public string? PrimaryImageUrl { get; set; }
    public bool IsFeatured { get; set; }
}

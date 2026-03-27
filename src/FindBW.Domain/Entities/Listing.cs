using FindBW.Domain.Enums;

namespace FindBW.Domain.Entities;

public class Listing
{
    public Guid Id { get; set; }
    public Guid AgentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal PriceBwp { get; set; }
    public ListingType ListingType { get; set; }
    public ListingStatus Status { get; set; }
    public PropertyType PropertyType { get; set; }
    public BotswanaCity City { get; set; }
    public string Suburb { get; set; } = string.Empty;
    public int? Bedrooms { get; set; }
    public int? Bathrooms { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public bool IsFeatured { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }

    public User Agent { get; set; } = null!;
    public ICollection<ListingImage> Images { get; set; } = new List<ListingImage>();
    public ICollection<Favorite> Favorites { get; set; } = new List<Favorite>();
}

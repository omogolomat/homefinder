namespace FindBW.Domain.Entities;

public class ListingImage
{
    public Guid Id { get; set; }
    public Guid ListingId { get; set; }
    public string Url { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsPrimary { get; set; }

    public Listing Listing { get; set; } = null!;
}

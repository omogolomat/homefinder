namespace FindBW.Domain.Entities;

public class AgentSubscription
{
    public Guid Id { get; set; }
    public Guid AgentId { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public int FeaturedSlots { get; set; }
    public int ListingQuota { get; set; }
    public DateTime RenewalDateUtc { get; set; }
    public bool IsActive { get; set; }

    public User Agent { get; set; } = null!;
}

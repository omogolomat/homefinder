using FindBW.Domain.Enums;

namespace FindBW.Domain.Entities;

public class PaymentTransaction
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public decimal AmountBwp { get; set; }
    public PaymentProvider Provider { get; set; }
    public PaymentStatus Status { get; set; }
    public string? ExternalReference { get; set; }
    public string? Purpose { get; set; }
    public DateTime CreatedAtUtc { get; set; }

    public User User { get; set; } = null!;
}

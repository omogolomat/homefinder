using FindBW.Domain.Enums;

namespace FindBW.Application.DTOs.Payments;

public class CreatePaymentIntentRequest
{
    public decimal AmountBwp { get; set; }
    public PaymentProvider Provider { get; set; }
    public string Purpose { get; set; } = string.Empty;
}

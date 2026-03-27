namespace FindBW.Application.DTOs.Payments;

public class PaymentIntentResponse
{
    public Guid TransactionId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Provider { get; set; } = string.Empty;
}

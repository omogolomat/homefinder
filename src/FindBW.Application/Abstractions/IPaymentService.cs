using FindBW.Application.DTOs.Payments;

namespace FindBW.Application.Abstractions;

public interface IPaymentService
{
    Task<PaymentIntentResponse> CreateIntentAsync(Guid userId, CreatePaymentIntentRequest request, CancellationToken cancellationToken = default);
}

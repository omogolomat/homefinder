using FindBW.Application.Abstractions;
using FindBW.Application.DTOs.Payments;
using FindBW.Domain.Entities;
using FindBW.Domain.Enums;
using FindBW.Infrastructure.Persistence;

namespace FindBW.Infrastructure.Services;

public class PaymentService : IPaymentService
{
    private readonly FindBwDbContext _db;

    public PaymentService(FindBwDbContext db)
    {
        _db = db;
    }

    public async Task<PaymentIntentResponse> CreateIntentAsync(Guid userId, CreatePaymentIntentRequest request, CancellationToken cancellationToken = default)
    {
        if (request.AmountBwp <= 0)
            throw new ArgumentOutOfRangeException(nameof(request.AmountBwp));

        var tx = new PaymentTransaction
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AmountBwp = request.AmountBwp,
            Provider = request.Provider,
            Status = PaymentStatus.Pending,
            Purpose = request.Purpose.Trim(),
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.PaymentTransactions.Add(tx);
        await _db.SaveChangesAsync(cancellationToken);

        var message = request.Provider switch
        {
            PaymentProvider.OrangeMoney =>
                "Complete payment in the Orange Money app using your reference. Webhook integration pending — contact support to confirm.",
            PaymentProvider.Fnb =>
                "Use FNB eWallet or banking app with the reference below. Bank API integration pending.",
            _ => "Payment recorded as pending."
        };

        return new PaymentIntentResponse
        {
            TransactionId = tx.Id,
            Status = "Pending",
            Message = message,
            Provider = request.Provider.ToString()
        };
    }
}

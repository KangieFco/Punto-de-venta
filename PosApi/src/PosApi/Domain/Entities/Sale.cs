using PosApi.Domain.Enums;

namespace PosApi.Domain.Entities;

public class Sale
{
    public int Id { get; set; }
    public string Folio { get; set; } = string.Empty;
    public int UserId { get; set; }
    public int CashRegisterId { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; } = 0;
    public decimal Tax { get; set; } = 0;
    public decimal Total { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public decimal AmountReceived { get; set; }
    public decimal ChangeAmount { get; set; }
    public SaleStatus Status { get; set; } = SaleStatus.Completed;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Cancelación
    public int? CancelledByUserId { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? CancellationReason { get; set; }

    // Navegación
    public User User { get; set; } = null!;
    public User? CancelledByUser { get; set; }
    public CashRegister CashRegister { get; set; } = null!;
    public ICollection<SaleDetail> SaleDetails { get; set; } = new List<SaleDetail>();
    public Ticket? Ticket { get; set; }
}
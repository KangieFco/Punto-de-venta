using PosApi.Domain.Enums;
namespace PosApi.Domain.Entities;

public class Layaway{
    public int Id { get; set; }
    public string Folio { get; set; } = string.Empty;
    public string ClientName  { get; set; } = string.Empty;
    public string? ClientPhone { get; set; }
    public decimal Total { get; set; }
    public decimal Deposit { get; set; }
    public decimal Remaining { get; set; }
    public string Status { get; set; } = "Pending";
    public int UserId { get; set; }
    public int? SaleId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt{ get; set; }
    public User User { get; set; } = null!;
    public Sale? Sale { get; set; }
    public ICollection<LayawayDetail> Details { get; set; } = new List<LayawayDetail>();
    public ICollection<LayawayPayment> Payments { get; set; } = new List<LayawayPayment>();
}

public class LayawayDetail {
    public int Id { get; set; }
    public int LayawayId { get; set; }
    public int ProductId { get; set; }
    public int Quantity  { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal  { get; set; }
    public Layaway Layaway { get; set; } = null!;
    public Product Product { get; set; } = null!;
}

public class LayawayPayment {
    public int Id { get; set; }
    public int LayawayId { get; set; }
    public decimal Amount { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public int UserId { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Layaway Layaway { get; set; } = null!;
    public User User { get; set; } = null!;
}
using PosApi.Domain.Enums;
using System.ComponentModel.DataAnnotations;
namespace PosApi.DTOs.Layaways;

public class CreateLayawayRequest{
    [Required, MaxLength(120)]
    public string ClientName { get; set; } = string.Empty;
    [MaxLength(20)]
    public string? ClientPhone { get; set; }
    [Required, Range(0, double.MaxValue)]
    public decimal Deposit { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;

    [Required, MinLength(1)]
    public List<LayawayItemRequest> Items { get; set; } = new();
}

public class LayawayItemRequest{
    [Required]
    public int ProductId { get; set; }
    [Required, Range(1, int.MaxValue)]
    public int Quantity  { get; set; }
}

public class AddDepositRequest{
    [Required, Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }
    [Required]
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    [MaxLength(200)]
    public string? Notes { get; set; }
}

public class LayawayDto{
    public int Id { get; set; }
    public string Folio { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public string? ClientPhone  { get; set; }
    public decimal Total { get; set; }
    public decimal Deposit { get; set; }
    public decimal Remaining { get; set; }
    public string Status { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public int? SaleId { get; set; }
    public string? SaleFolio { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int DaysLeft { get; set; }
    public bool IsExpired { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<LayawayDetailDto>  Details  { get; set; } = new();
    public List<LayawayPaymentDto> Payments { get; set; } = new();
}

public class LayawayDetailDto{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
}

public class LayawayPaymentDto{
    public int Id { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string UserFullName  { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}
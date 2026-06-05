using PosApi.Domain.Enums;
namespace PosApi.DTOs.Sales;

public class SaleDto
{
    public int Id { get; set; }
    public string  Folio { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string  UserFullName   { get; set; } = string.Empty;
    public int CashRegisterId { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Discount { get; set; }
    public decimal Tax { get; set; }
    public decimal Total { get; set; }
    public string  PaymentMethod { get; set; } = string.Empty;
    public decimal AmountReceived { get; set; }
    public decimal ChangeAmount { get; set; }
    public decimal ExchangeRate { get; set; } 
    public List<PaymentBreakdownDto> PaymentBreakdown { get; set; } = new();
    public string  Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<SaleDetailDto> Details { get; set; } = new();
}

public class PaymentBreakdownDto
{
    public string  Method { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class SaleDetailDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }  
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal Subtotal { get; set; }
}
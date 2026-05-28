using PosApi.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace PosApi.DTOs.Sales;

public class CreateSaleRequest
{
    [Required, MinLength(1)]
    public List<SaleItemRequest> Items { get; set; } = new();

    [Required]
    public PaymentMethod PaymentMethod { get; set; }

    [Required, Range(0.01, double.MaxValue)]
    public decimal AmountReceived { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Discount { get; set; } = 0;
    
    [Range(0.01, double.MaxValue)]
    public decimal ExchangeRate { get; set; } = 1;
}

public class SaleItemRequest
{
    [Required]
    public int ProductId { get; set; }

    [Required, Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [Range(0, double.MaxValue)]
    public decimal Discount { get; set; } = 0;
}
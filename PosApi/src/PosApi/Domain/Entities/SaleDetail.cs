namespace PosApi.Domain.Entities;

public class SaleDetail
{
    public int Id { get; set; }
    public int SaleId { get; set; }
    public int ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; } = 0;
    public decimal Subtotal { get; set; }

    // Navegación
    public Sale Sale { get; set; } = null!;
    public Product Product { get; set; } = null!;
}
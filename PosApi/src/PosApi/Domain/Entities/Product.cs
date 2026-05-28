namespace PosApi.Domain.Entities;

public class Product
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;       // Código interno
    public string? Barcode { get; set; }                    // Código de barras
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl    { get; set; } 
    public int CategoryId { get; set; }
    public decimal CostPrice { get; set; }
    public decimal SalePrice { get; set; }
    public int Stock { get; set; } = 0;
    public int MinStock { get; set; } = 0;
    public string Unit { get; set; } = "PZA";              // PZA, KG, LT, etc.
    public bool Active { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navegación
    public Category Category { get; set; } = null!;
    public ICollection<SaleDetail> SaleDetails { get; set; } = new List<SaleDetail>();
    public ICollection<InventoryMovement> InventoryMovements { get; set; } = new List<InventoryMovement>();
}
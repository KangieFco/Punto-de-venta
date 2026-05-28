namespace PosApi.DTOs.Products;

public class ProductDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImageUrl    { get; set; } 
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal SalePrice { get; set; }
    public int Stock { get; set; }
    public int MinStock { get; set; }
    public string Unit { get; set; } = string.Empty;
    public bool Active { get; set; }
    public bool IsLowStock => Stock <= MinStock;
}
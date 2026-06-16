using System.ComponentModel.DataAnnotations;
namespace PosApi.DTOs.Products;

public class SaveProductRequest{
    [MaxLength(150)]
    public string? Barcode { get; set; }

    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Description { get; set; }

    [Required]
    public int CategoryId { get; set; }

    [Range(0, double.MaxValue)]
    public decimal CostPrice { get; set; }

    [Required, Range(0.01, double.MaxValue)]
    public decimal SalePrice { get; set; }

    [Range(0, int.MaxValue)]
    public int Stock { get; set; }

    [Range(0, int.MaxValue)]
    public int MinStock { get; set; }

    [Required, MaxLength(20)]
    public string Unit { get; set; } = "PZA";
}
using System.ComponentModel.DataAnnotations;

namespace PosApi.DTOs.Inventory;

public class InventoryEntryRequest
{
    [Required]
    public int ProductId { get; set; }

    [Required, Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [MaxLength(200)]
    public string? Reason { get; set; }
}

public class InventoryOutputRequest
{
    [Required]
    public int ProductId { get; set; }

    [Required, Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [MaxLength(200)]
    public string? Reason { get; set; }
}

public class InventoryAdjustmentRequest
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    public int NewStock { get; set; }   // Stock absoluto deseado

    [MaxLength(200)]
    public string? Reason { get; set; }
}
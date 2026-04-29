using PosApi.Domain.Enums;

namespace PosApi.Domain.Entities;

public class InventoryMovement
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public MovementType MovementType { get; set; }
    public int Quantity { get; set; }
    public int PreviousStock { get; set; }
    public int NewStock { get; set; }
    public string? Reason { get; set; }
    public string? Reference { get; set; }   // Ej: folio de venta
    public int UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navegación
    public Product Product { get; set; } = null!;
    public User User { get; set; } = null!;
}
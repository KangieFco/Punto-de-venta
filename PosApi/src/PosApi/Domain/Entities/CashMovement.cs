using PosApi.Domain.Enums;

namespace PosApi.Domain.Entities;

public class CashMovement
{
    public int Id { get; set; }
    public int CashRegisterId { get; set; }
    public CashMovementType Type { get; set; }
    public decimal Amount { get; set; }
    public string? Reason { get; set; }
    public int UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navegación
    public CashRegister CashRegister { get; set; } = null!;
    public User User { get; set; } = null!;
}
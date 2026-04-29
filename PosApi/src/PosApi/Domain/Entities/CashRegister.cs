using PosApi.Domain.Enums;

namespace PosApi.Domain.Entities;

public class CashRegister
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public decimal OpeningAmount { get; set; }
    public decimal? ClosingAmount { get; set; }
    public decimal? ExpectedAmount { get; set; }
    public decimal? Difference { get; set; }
    public CashRegisterStatus Status { get; set; } = CashRegisterStatus.Open;
    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }

    // Navegación
    public User User { get; set; } = null!;
    public ICollection<Sale> Sales { get; set; } = new List<Sale>();
    public ICollection<CashMovement> CashMovements { get; set; } = new List<CashMovement>();
}
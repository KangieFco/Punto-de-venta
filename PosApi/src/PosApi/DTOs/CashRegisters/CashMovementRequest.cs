using System.ComponentModel.DataAnnotations;

namespace PosApi.DTOs.CashRegisters;

public class CashMovementRequest
{
    [Required, Range(0.01, double.MaxValue)]
    public decimal Amount { get; set; }

    [MaxLength(200)]
    public string? Reason { get; set; }
}

public class CashMovementDto
{
    public int Id { get; set; }
    public int CashRegisterId { get; set; }
    public string Type { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string? Reason { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
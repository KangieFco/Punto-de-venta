using System.ComponentModel.DataAnnotations;

namespace PosApi.DTOs.CashRegisters;

public class CloseCashRegisterRequest
{
    [Required, Range(0, double.MaxValue)]
    public decimal ClosingAmount { get; set; }
}
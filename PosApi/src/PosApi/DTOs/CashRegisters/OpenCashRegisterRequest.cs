using System.ComponentModel.DataAnnotations;

namespace PosApi.DTOs.CashRegisters;

public class OpenCashRegisterRequest
{
    [Required, Range(0, double.MaxValue)]
    public decimal OpeningAmount { get; set; }
}
using System.ComponentModel.DataAnnotations;

namespace PosApi.DTOs.Sales;

public class CancelSaleRequest
{
    [Required, MaxLength(200)]
    public string Reason { get; set; } = string.Empty;
}
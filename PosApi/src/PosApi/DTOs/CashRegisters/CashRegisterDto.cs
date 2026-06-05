namespace PosApi.DTOs.CashRegisters;

public class CashRegisterDto{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public decimal OpeningAmount { get; set; }
    public decimal? ClosingAmount { get; set; }
    public decimal? ExpectedAmount { get; set; }
    public decimal? Difference { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
}
public class CashRegisterCloseResultDto{
    public int Id { get; set; }
    public string UserFullName { get; set; } = string.Empty;
    public DateTime OpenedAt { get; set; }
    public DateTime ClosedAt { get; set; }
    public decimal OpeningAmount { get; set; }
    public decimal ClosingAmount { get; set; }
    public decimal ExpectedAmount { get; set; }
    public decimal Difference { get; set; }
    public int TotalSales { get; set; }
    public int CancelledSales { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal CashRevenue { get; set; }
    public decimal CardRevenue { get; set; }
    public decimal DollarRevenue { get; set; }
    public decimal OtherRevenue { get; set; }
    public decimal ManualIncoming { get; set; }
    public decimal ManualOutgoing { get; set; }
    public int MovementsCount { get; set; }
    public decimal ExpectedCash     { get; set; } 
    public List<CashMovementDto> Movements { get; set; } = new();
    public List<CashRegisterSaleSummary> SalesList { get; set; } = new();
}

public class CashRegisterSaleSummary {
    public string Folio { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
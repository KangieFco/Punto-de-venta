namespace PosApi.DTOs.Reports;

public class SalesReportDto
{
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public int TotalSales { get; set; }
    public int CancelledSales { get; set; }
    public decimal TotalRevenue { get; set; }
    public List<SaleReportItemDto> Sales { get; set; } = new();
}

public class SaleReportItemDto
{
    public string Folio { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class TopProductDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int TotalQuantitySold { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class DailySummaryDto
{
    public DateTime Date { get; set; }
    public int TotalSales { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal CashRevenue { get; set; }
    public decimal CardRevenue { get; set; }
    public decimal OtherRevenue { get; set; }
}
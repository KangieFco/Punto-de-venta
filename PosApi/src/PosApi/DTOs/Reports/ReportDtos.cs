namespace PosApi.DTOs.Reports;

public class SalesReportDto
{
    public DateTime From           { get; set; }
    public DateTime To             { get; set; }
    public int      TotalSales     { get; set; }
    public int      CancelledSales { get; set; }
    public decimal  TotalRevenue   { get; set; }
    public List<SaleReportItemDto> Sales { get; set; } = new();
}

public class SaleReportItemDto
{
    public string   Folio         { get; set; } = string.Empty;
    public string   UserFullName  { get; set; } = string.Empty;
    public decimal  Total         { get; set; }
    public string   PaymentMethod { get; set; } = string.Empty;
    public string   Status        { get; set; } = string.Empty;
    public DateTime CreatedAt     { get; set; }
}

public class SalesByUserDto
{
    public int     UserId       { get; set; }
    public string  UserFullName { get; set; } = string.Empty;
    public int     TotalSales   { get; set; }
    public decimal TotalRevenue { get; set; }
}

public class TopProductDto
{
    public int     ProductId          { get; set; }
    public string  ProductName        { get; set; } = string.Empty;
    public int     TotalQuantitySold  { get; set; }
    public decimal TotalRevenue       { get; set; }
}

public class InventoryReportDto
{
    public int     ProductId    { get; set; }
    public string  ProductName  { get; set; } = string.Empty;
    public string  CategoryName { get; set; } = string.Empty;
    public int     Stock        { get; set; }
    public int     MinStock     { get; set; }
    public decimal CostPrice    { get; set; }
    public decimal SalePrice    { get; set; }
    public string  Unit         { get; set; } = string.Empty;
    public bool    IsLowStock   { get; set; }
}

public class CashRegisterReportDto
{
    public int      Id             { get; set; }
    public string   UserFullName   { get; set; } = string.Empty;
    public decimal  OpeningAmount  { get; set; }
    public decimal? ClosingAmount  { get; set; }
    public decimal? ExpectedAmount { get; set; }
    public decimal? Difference     { get; set; }
    public int      TotalSales     { get; set; }
    public decimal  TotalRevenue   { get; set; }
    public string   Status        { get; set; } = string.Empty;
    public DateTime OpenedAt       { get; set; }
    public DateTime? ClosedAt      { get; set; }
}

public class DailySummaryDto
{
    public DateTime Date          { get; set; }
    public int      TotalSales    { get; set; }
    public decimal  TotalRevenue  { get; set; }
    public decimal  CashRevenue   { get; set; }
    public decimal  CardRevenue   { get; set; }
    public decimal  OtherRevenue  { get; set; }
    public int      CancelledSales{ get; set; }
    public List<TopProductDto> TopProducts { get; set; } = new();
}
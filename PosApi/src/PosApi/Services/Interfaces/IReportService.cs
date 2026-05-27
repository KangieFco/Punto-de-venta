using PosApi.DTOs.Reports;

namespace PosApi.Services.Interfaces;

public interface IReportService
{
    Task<SalesReportDto> GetSalesReportAsync(DateTime from, DateTime to);
    Task<List<SalesByUserDto>> GetSalesByUserAsync(DateTime from, DateTime to);
    Task<List<TopProductDto>> GetTopProductsAsync(DateTime from, DateTime to, int top = 10);
    Task<List<InventoryReportDto>> GetInventoryAsync();
    Task<List<CashRegisterReportDto>> GetCashRegistersReportAsync(DateTime from, DateTime to);
    Task<DailySummaryDto> GetDailySummaryAsync(DateTime date);
}
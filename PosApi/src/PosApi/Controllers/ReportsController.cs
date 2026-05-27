using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosApi.Common;
using PosApi.DTOs.Reports;
using PosApi.Services.Interfaces;

namespace PosApi.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = "Admin,Supervisor")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
        => _reportService = reportService;

    // GET /api/reports/sales?from=2024-01-01&to=2024-01-31
    [HttpGet("sales")]
    public async Task<IActionResult> GetSales(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to)
    {
        var result = await _reportService.GetSalesReportAsync(from, to);
        return Ok(ApiResponse<SalesReportDto>.Ok(result));
    }

    // GET /api/reports/sales-by-user?from=&to=
    [HttpGet("sales-by-user")]
    public async Task<IActionResult> GetSalesByUser(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to)
    {
        var result = await _reportService.GetSalesByUserAsync(from, to);
        return Ok(ApiResponse<List<SalesByUserDto>>.Ok(result));
    }

    // GET /api/reports/top-products?from=&to=&top=10
    [HttpGet("top-products")]
    public async Task<IActionResult> GetTopProducts(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to,
        [FromQuery] int top = 10)
    {
        var result = await _reportService.GetTopProductsAsync(from, to, top);
        return Ok(ApiResponse<List<TopProductDto>>.Ok(result));
    }

    // GET /api/reports/inventory
    [HttpGet("inventory")]
    [Authorize(Roles = "Admin,Supervisor,Inventario")]
    public async Task<IActionResult> GetInventory()
    {
        var result = await _reportService.GetInventoryAsync();
        return Ok(ApiResponse<List<InventoryReportDto>>.Ok(result));
    }

    // GET /api/reports/cash-registers?from=&to=
    [HttpGet("cash-registers")]
    public async Task<IActionResult> GetCashRegisters(
        [FromQuery] DateTime from,
        [FromQuery] DateTime to)
    {
        var result = await _reportService.GetCashRegistersReportAsync(from, to);
        return Ok(ApiResponse<List<CashRegisterReportDto>>.Ok(result));
    }

    // GET /api/reports/daily-summary?date=2024-01-15
    [HttpGet("daily-summary")]
    public async Task<IActionResult> GetDailySummary([FromQuery] DateTime date)
    {
        var result = await _reportService.GetDailySummaryAsync(date);
        return Ok(ApiResponse<DailySummaryDto>.Ok(result));
    }
}
using Microsoft.EntityFrameworkCore;
using PosApi.Data;
using PosApi.Domain.Enums;
using PosApi.DTOs.Reports;
using PosApi.Services.Interfaces;

namespace PosApi.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _db;

    public ReportService(AppDbContext db) => _db = db;

    // ── Ventas por rango ──────────────────────────────────────

    public async Task<SalesReportDto> GetSalesReportAsync(DateTime from, DateTime to)
    {
        var toEnd = to.Date.AddDays(1);

        var sales = await _db.Sales
            .Include(s => s.User)
            .Where(s => s.CreatedAt >= from.Date && s.CreatedAt < toEnd)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return new SalesReportDto
        {
            From           = from,
            To             = to,
            TotalSales     = sales.Count(s => s.Status == SaleStatus.Completed),
            CancelledSales = sales.Count(s => s.Status == SaleStatus.Cancelled),
            TotalRevenue   = sales.Where(s => s.Status == SaleStatus.Completed)
                                  .Sum(s => s.Total),
            Sales = sales.Select(s => new SaleReportItemDto
            {
                Folio         = s.Folio,
                UserFullName  = s.User.FullName,
                Total         = s.Total,
                PaymentMethod = s.PaymentMethod.ToString(),
                Status        = s.Status.ToString(),
                CreatedAt     = s.CreatedAt
            }).ToList()
        };
    }

    // ── Ventas por usuario ────────────────────────────────────

    public async Task<List<SalesByUserDto>> GetSalesByUserAsync(
        DateTime from, DateTime to)
    {
        var toEnd = to.Date.AddDays(1);

        return await _db.Sales
            .Include(s => s.User)
            .Where(s => s.CreatedAt >= from.Date &&
                        s.CreatedAt < toEnd &&
                        s.Status == SaleStatus.Completed)
            .GroupBy(s => new { s.UserId, s.User.FullName })
            .Select(g => new SalesByUserDto
            {
                UserId       = g.Key.UserId,
                UserFullName = g.Key.FullName,
                TotalSales   = g.Count(),
                TotalRevenue = g.Sum(s => s.Total)
            })
            .OrderByDescending(x => x.TotalRevenue)
            .ToListAsync();
    }

    // ── Productos más vendidos ────────────────────────────────

    public async Task<List<TopProductDto>> GetTopProductsAsync(
        DateTime from, DateTime to, int top = 10)
    {
        var toEnd = to.Date.AddDays(1);

        return await _db.SaleDetails
            .Include(d => d.Sale)
            .Include(d => d.Product)
            .Where(d => d.Sale.CreatedAt >= from.Date &&
                        d.Sale.CreatedAt < toEnd &&
                        d.Sale.Status == SaleStatus.Completed)
            .GroupBy(d => new { d.ProductId, d.Product.Name })
            .Select(g => new TopProductDto
            {
                ProductId         = g.Key.ProductId,
                ProductName       = g.Key.Name,
                TotalQuantitySold = g.Sum(d => d.Quantity),
                TotalRevenue      = g.Sum(d => d.Subtotal)
            })
            .OrderByDescending(x => x.TotalQuantitySold)
            .Take(top)
            .ToListAsync();
    }

    // ── Inventario actual ─────────────────────────────────────

    public async Task<List<InventoryReportDto>> GetInventoryAsync()
    {
        return await _db.Products
            .Include(p => p.Category)
            .Where(p => p.Active)
            .OrderBy(p => p.Category.Name)
            .ThenBy(p => p.Name)
            .Select(p => new InventoryReportDto
            {
                ProductId    = p.Id,
                ProductName  = p.Name,
                CategoryName = p.Category.Name,
                Stock        = p.Stock,
                MinStock     = p.MinStock,
                CostPrice    = p.CostPrice,
                SalePrice    = p.SalePrice,
                Unit         = p.Unit,
                IsLowStock   = p.Stock <= p.MinStock
            })
            .ToListAsync();
    }

    // ── Cortes de caja ────────────────────────────────────────

    public async Task<List<CashRegisterReportDto>> GetCashRegistersReportAsync(
        DateTime from, DateTime to)
    {
        var toEnd = to.Date.AddDays(1);

        var registers = await _db.CashRegisters
            .Include(cr => cr.User)
            .Include(cr => cr.Sales)
            .Where(cr => cr.OpenedAt >= from.Date && cr.OpenedAt < toEnd)
            .OrderByDescending(cr => cr.OpenedAt)
            .ToListAsync();

        return registers.Select(cr => new CashRegisterReportDto
        {
            Id             = cr.Id,
            UserFullName   = cr.User.FullName,
            OpeningAmount  = cr.OpeningAmount,
            ClosingAmount  = cr.ClosingAmount,
            ExpectedAmount = cr.ExpectedAmount,
            Difference     = cr.Difference,
            TotalSales     = cr.Sales.Count(s => s.Status == SaleStatus.Completed),
            TotalRevenue   = cr.Sales
                               .Where(s => s.Status == SaleStatus.Completed)
                               .Sum(s => s.Total),
            Status   = cr.Status.ToString(),
            OpenedAt = cr.OpenedAt,
            ClosedAt = cr.ClosedAt
        }).ToList();
    }

    // ── Resumen diario ────────────────────────────────────────

    public async Task<DailySummaryDto> GetDailySummaryAsync(DateTime date)
    {
        var from  = date.Date;
        var toEnd = from.AddDays(1);

        var sales = await _db.Sales
            .Include(s => s.SaleDetails)
                .ThenInclude(d => d.Product)
            .Where(s => s.CreatedAt >= from && s.CreatedAt < toEnd)
            .ToListAsync();

        var completed = sales.Where(s => s.Status == SaleStatus.Completed).ToList();

        var topProducts = completed
            .SelectMany(s => s.SaleDetails)
            .GroupBy(d => new { d.ProductId, d.Product.Name })
            .Select(g => new TopProductDto
            {
                ProductId         = g.Key.ProductId,
                ProductName       = g.Key.Name,
                TotalQuantitySold = g.Sum(d => d.Quantity),
                TotalRevenue      = g.Sum(d => d.Subtotal)
            })
            .OrderByDescending(x => x.TotalQuantitySold)
            .Take(5)
            .ToList();

        return new DailySummaryDto
        {
            Date           = date.Date,
            TotalSales     = completed.Count,
            CancelledSales = sales.Count(s => s.Status == SaleStatus.Cancelled),
            TotalRevenue   = completed.Sum(s => s.Total),
            CashRevenue    = completed
                                .Where(s => s.PaymentMethod == PaymentMethod.Cash)
                                .Sum(s => s.Total),
            CardRevenue    = completed
                                .Where(s => s.PaymentMethod == PaymentMethod.Card)
                                .Sum(s => s.Total),
            OtherRevenue   = completed
                                .Where(s => s.PaymentMethod == PaymentMethod.Other)
                                .Sum(s => s.Total),
            TopProducts    = topProducts
        };
    }
}
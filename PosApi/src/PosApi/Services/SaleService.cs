using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PosApi.Common.Exceptions;
using PosApi.Data;
using PosApi.Domain.Entities;
using PosApi.Domain.Enums;
using PosApi.DTOs.Sales;
using PosApi.Services.Interfaces;

namespace PosApi.Services;

public class SaleService : ISaleService
{
    private readonly AppDbContext        _db;
    private readonly IInventoryService   _inventoryService;
    private readonly ICashRegisterService _cashService;
    private readonly IConfiguration      _config;

    public SaleService(AppDbContext db,
                       IInventoryService inventoryService,
                       ICashRegisterService cashService,
                       IConfiguration config)
    {
        _db               = db;
        _inventoryService = inventoryService;
        _cashService      = cashService;
        _config           = config;
    }

    // ── Crear venta ───────────────────────────────────────────

    public async Task<SaleDto> CreateAsync(CreateSaleRequest request, int userId)
    {
        // 1. Verificar caja abierta
        var cashRegisterId = await _cashService.GetOpenRegisterIdAsync(userId);

        // 2. Verificar todos los productos antes de proceder
        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var products   = await _db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync();

        var allowNegative = _config.GetValue<bool>("AllowNegativeStock");

        foreach (var item in request.Items)
        {
            var product = products.FirstOrDefault(p => p.Id == item.ProductId)
                ?? throw new NotFoundException("Producto", item.ProductId);

            if (!product.Active)
                throw new BusinessException(
                    $"El producto '{product.Name}' está inactivo y no puede venderse.");

            if (!allowNegative && product.Stock < item.Quantity)
                throw new BusinessException(
                    $"Stock insuficiente para '{product.Name}'. " +
                    $"Disponible: {product.Stock}, solicitado: {item.Quantity}.");
        }

        // 3. Calcular totales
        decimal subtotal = 0;

        var details = request.Items.Select(item =>
        {
            var product   = products.First(p => p.Id == item.ProductId);
            var itemSub   = (product.SalePrice - item.Discount) * item.Quantity;
            subtotal     += itemSub;

            return new SaleDetail
            {
                ProductId = item.ProductId,
                Quantity  = item.Quantity,
                UnitPrice = product.SalePrice,
                Discount  = item.Discount,
                Subtotal  = itemSub
            };
        }).ToList();

        var total  = subtotal - request.Discount;
        var change = request.AmountReceived - total;

        if (change < 0)
            throw new BusinessException(
                $"El monto recibido (${request.AmountReceived}) " +
                $"es menor al total (${total}).");

        // 4. Crear la venta
        var folio = await GenerateFolioAsync();
        var sale  = new Sale
        {
            Folio          = folio,
            UserId         = userId,
            CashRegisterId = cashRegisterId,
            Subtotal       = subtotal,
            Discount       = request.Discount,
            Tax            = 0,
            Total          = total,
            PaymentMethod  = request.PaymentMethod,
            AmountReceived = request.AmountReceived,
            ChangeAmount   = change,
            Status         = SaleStatus.Completed,
            CreatedAt      = DateTime.UtcNow,
            SaleDetails    = details
        };

        _db.Sales.Add(sale);

        // 5. Descontar inventario (dentro de la misma transacción)
        foreach (var item in request.Items)
        {
            await _inventoryService.DiscountStockAsync(
                item.ProductId, item.Quantity, folio, userId);
        }

        // 6. Crear ticket
        _db.Tickets.Add(new Ticket
        {
            Sale         = sale,
            Folio        = folio,
            PrintedCount = 0,
            CreatedAt    = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();
        return await GetByIdAsync(sale.Id);
    }

    // ── Cancelar venta ────────────────────────────────────────

    public async Task CancelAsync(int id, CancelSaleRequest request, int userId)
    {
        var sale = await _db.Sales
            .Include(s => s.SaleDetails)
            .FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new NotFoundException("Venta", id);

        if (sale.Status == SaleStatus.Cancelled)
            throw new BusinessException("Esta venta ya fue cancelada.");

        sale.Status             = SaleStatus.Cancelled;
        sale.CancelledByUserId  = userId;
        sale.CancelledAt        = DateTime.UtcNow;
        sale.CancellationReason = request.Reason;

        // Revertir inventario
        foreach (var detail in sale.SaleDetails)
        {
            await _inventoryService.ReturnStockAsync(
                detail.ProductId, detail.Quantity, sale.Folio, userId);
        }

        await _db.SaveChangesAsync();
    }

    // ── Consultas ─────────────────────────────────────────────

    public async Task<List<SaleDto>> GetAllAsync()
    {
        return await _db.Sales
            .Include(s => s.User)
            .Include(s => s.SaleDetails)
                .ThenInclude(d => d.Product)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => ToDto(s))
            .ToListAsync();
    }

    public async Task<SaleDto> GetByIdAsync(int id)
    {
        var sale = await _db.Sales
            .Include(s => s.User)
            .Include(s => s.SaleDetails)
                .ThenInclude(d => d.Product)
            .FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new NotFoundException("Venta", id);

        return ToDto(sale);
    }

    public async Task<SaleDto> GetByFolioAsync(string folio)
    {
        var sale = await _db.Sales
            .Include(s => s.User)
            .Include(s => s.SaleDetails)
                .ThenInclude(d => d.Product)
            .FirstOrDefaultAsync(s => s.Folio == folio)
            ?? throw new NotFoundException($"Venta con folio '{folio}' no encontrada.");

        return ToDto(sale);
    }

    // ── Folio único ───────────────────────────────────────────

    private async Task<string> GenerateFolioAsync()
    {
        // Formato: VTA-20240315-0001
        var today  = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"VTA-{today}-";

        var lastFolio = await _db.Sales
            .Where(s => s.Folio.StartsWith(prefix))
            .OrderByDescending(s => s.Folio)
            .Select(s => s.Folio)
            .FirstOrDefaultAsync();

        int next = 1;
        if (lastFolio is not null)
        {
            var lastNum = lastFolio.Replace(prefix, "");
            if (int.TryParse(lastNum, out var n)) next = n + 1;
        }

        return $"{prefix}{next:D4}";
    }

    // ── Mapper ────────────────────────────────────────────────

    private static SaleDto ToDto(Sale s) => new()
    {
        Id             = s.Id,
        Folio          = s.Folio,
        UserId         = s.UserId,
        UserFullName   = s.User.FullName,
        CashRegisterId = s.CashRegisterId,
        Subtotal       = s.Subtotal,
        Discount       = s.Discount,
        Tax            = s.Tax,
        Total          = s.Total,
        PaymentMethod  = s.PaymentMethod.ToString(),
        AmountReceived = s.AmountReceived,
        ChangeAmount   = s.ChangeAmount,
        Status         = s.Status.ToString(),
        CreatedAt      = s.CreatedAt,
        Details        = s.SaleDetails.Select(d => new SaleDetailDto
        {
            ProductId   = d.ProductId,
            ProductName = d.Product.Name,
            Quantity    = d.Quantity,
            UnitPrice   = d.UnitPrice,
            Discount    = d.Discount,
            Subtotal    = d.Subtotal
        }).ToList()
    };
}
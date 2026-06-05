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
    private readonly AppDbContext _db;
    private readonly IInventoryService _inventoryService;
    private readonly ICashRegisterService _cashService;
    private readonly IConfiguration _config;

    public SaleService(
        AppDbContext db,
        IInventoryService inventoryService,
        ICashRegisterService cashService,
        IConfiguration config)
    {
        _db = db;
        _inventoryService = inventoryService;
        _cashService = cashService;
        _config = config;
    }

    public async Task<SaleDto> CreateAsync(CreateSaleRequest request, int userId)
    {
        if (request.Items == null || !request.Items.Any())
            throw new BusinessException("La venta debe tener al menos un producto.");

        var cashRegisterId = await _cashService.GetOpenRegisterIdAsync(userId);
        var productIds = request.Items
            .Select(i => i.ProductId)
            .Distinct()
            .ToList();

        var products = await _db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToListAsync();

        var allowNegative = _config.GetValue<bool>("AllowNegativeStock");

        foreach (var item in request.Items)
        {
            if (item.Quantity <= 0)
                throw new BusinessException("La cantidad del producto debe ser mayor a cero.");

            var product = products.FirstOrDefault(p => p.Id == item.ProductId)
                ?? throw new NotFoundException("Producto", item.ProductId);

            if (!product.Active)
                throw new BusinessException(
                    $"El producto '{product.Name}' está inactivo y no puede venderse.");

            if (item.Discount < 0)
                throw new BusinessException(
                    $"El descuento del producto '{product.Name}' no puede ser negativo.");

            if (item.Discount > product.SalePrice)
                throw new BusinessException(
                    $"El descuento del producto '{product.Name}' no puede ser mayor al precio de venta.");

            if (!allowNegative && product.Stock < item.Quantity)
                throw new BusinessException(
                    $"Stock insuficiente para '{product.Name}'. " +
                    $"Disponible: {product.Stock}, solicitado: {item.Quantity}.");
        }

        decimal subtotal = 0;

        var details = request.Items.Select(item =>
        {
            var product = products.First(p => p.Id == item.ProductId);

            var itemSub = (product.SalePrice - item.Discount) * item.Quantity;
            subtotal += itemSub;

            return new SaleDetail
            {
                ProductId = item.ProductId,
                Quantity = item.Quantity,
                UnitPrice = product.SalePrice,
                Discount = item.Discount,
                Subtotal = itemSub
            };
        }).ToList();

        if (request.Discount < 0)
            throw new BusinessException("El descuento general no puede ser negativo.");

        if (request.Discount > subtotal)
            throw new BusinessException("El descuento general no puede ser mayor al subtotal.");

        var total = subtotal - request.Discount;

        if (request.AmountReceived < 0)
            throw new BusinessException("El monto recibido no puede ser negativo.");

        decimal amountInPesos;

        if (request.PaymentMethod == PaymentMethod.Dollar)
        {
            if (request.ExchangeRate <= 0)
                throw new BusinessException("El tipo de cambio debe ser mayor a cero.");

            amountInPesos = request.AmountReceived * request.ExchangeRate;
        }
        else
        {
            amountInPesos = request.AmountReceived;
        }

        var change = amountInPesos - total;

        if (change < 0)
            throw new BusinessException(
                $"El monto recibido es menor al total (${total:F2}).");
        var folio = await GenerateFolioAsync();

        var sale = new Sale
        {
            Folio = folio,
            UserId = userId,
            CashRegisterId = cashRegisterId,
            Subtotal = subtotal,
            Discount = request.Discount,
            Tax = 0,
            Total = total,
            PaymentMethod = request.PaymentMethod,
            AmountReceived = request.AmountReceived,
            ChangeAmount = change,
            ExchangeRate = request.ExchangeRate,
            Status = SaleStatus.Completed,
            CreatedAt = DateTime.UtcNow,
            SaleDetails = details
        };

        _db.Sales.Add(sale);
        foreach (var item in request.Items)
        {
            await _inventoryService.DiscountStockAsync(
                item.ProductId,
                item.Quantity,
                folio,
                userId);
        }
        _db.Tickets.Add(new Ticket
        {
            Sale = sale,
            Folio = folio,
            PrintedCount = 0,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        return await GetByIdAsync(sale.Id);
    }
    public async Task CancelAsync(int id, CancelSaleRequest request, int userId)
    {
        var sale = await _db.Sales
            .Include(s => s.SaleDetails)
            .FirstOrDefaultAsync(s => s.Id == id)
            ?? throw new NotFoundException("Venta", id);

        if (sale.Status == SaleStatus.Cancelled)
            throw new BusinessException("Esta venta ya fue cancelada.");

        sale.Status = SaleStatus.Cancelled;
        sale.CancelledByUserId = userId;
        sale.CancelledAt = DateTime.UtcNow;
        sale.CancellationReason = request.Reason;
        foreach (var detail in sale.SaleDetails)
        {
            await _inventoryService.ReturnStockAsync(
                detail.ProductId,
                detail.Quantity,
                sale.Folio,
                userId);
        }

        await _db.SaveChangesAsync();
    }

    public async Task<List<SaleDto>> GetAllAsync()
    {
        var sales = await _db.Sales
            .Include(s => s.User)
            .Include(s => s.SaleDetails)
                .ThenInclude(d => d.Product)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return sales.Select(ToDto).ToList();
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

    private async Task<string> GenerateFolioAsync()
    {
        // Formato: VTA-20260528-0001
        var today = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix = $"VTA-{today}-";

        var lastFolio = await _db.Sales
            .Where(s => s.Folio.StartsWith(prefix))
            .OrderByDescending(s => s.Folio)
            .Select(s => s.Folio)
            .FirstOrDefaultAsync();

        var next = 1;

        if (lastFolio is not null)
        {
            var lastNum = lastFolio.Replace(prefix, "");

            if (int.TryParse(lastNum, out var n))
                next = n + 1;
        }

        return $"{prefix}{next:D4}";
    }

    private static SaleDto ToDto(Sale s) {
        var breakdown = new List<PaymentBreakdownDto>();
        if (!string.IsNullOrWhiteSpace(s.PaymentBreakdown))
        {
            foreach (var part in s.PaymentBreakdown.Split(','))
            {
                var lastColon = part.LastIndexOf(':');
                if (lastColon <= 0) continue;
                var method = part[..lastColon].Trim();
                var amountStr = part[(lastColon + 1)..].Trim();
                if (decimal.TryParse(
                        amountStr,
                        System.Globalization.NumberStyles.Any,
                        System.Globalization.CultureInfo.InvariantCulture,
                        out var amount)) {
                    breakdown.Add(new PaymentBreakdownDto{
                        Method = method,
                        Amount = amount
                    });
                }
            }
        }

        return new SaleDto {
            Id = s.Id,
            Folio = s.Folio,
            UserId = s.UserId,
            UserFullName = s.User.FullName,
            CashRegisterId = s.CashRegisterId,
            Subtotal = s.Subtotal,
            Discount = s.Discount,
            Tax = s.Tax,
            Total = s.Total,
            PaymentMethod = s.PaymentMethod.ToString(),
            PaymentBreakdown = breakdown,
            AmountReceived = s.AmountReceived,
            ChangeAmount = s.ChangeAmount,
            ExchangeRate = s.ExchangeRate,
            Status = s.Status.ToString(),
            CreatedAt = s.CreatedAt,
            Details = s.SaleDetails.Select(d => new SaleDetailDto {
                ProductId = d.ProductId,
                ProductName = d.Product.Name,
                ImageUrl = d.Product.ImageUrl,
                Quantity = d.Quantity,
                UnitPrice = d.UnitPrice,
                Discount = d.Discount,
                Subtotal = d.Subtotal
            }).ToList()
        };
    }
}
using Microsoft.EntityFrameworkCore;
using PosApi.Common.Exceptions;
using PosApi.Data;
using PosApi.Domain.Entities;
using PosApi.Domain.Enums;
using PosApi.DTOs.Inventory;
using PosApi.Services.Interfaces;

namespace PosApi.Services;

public class InventoryService : IInventoryService
{
    private readonly AppDbContext _db;

    public InventoryService(AppDbContext db) => _db = db;

    // ── Consultas ─────────────────────────────────────────────

    public async Task<List<InventoryMovementDto>> GetMovementsAsync(int? productId = null)
    {
        var query = _db.InventoryMovements
            .Include(m => m.Product)
            .Include(m => m.User)
            .AsQueryable();

        if (productId.HasValue)
            query = query.Where(m => m.ProductId == productId.Value);

        return await query
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => ToDto(m))
            .ToListAsync();
    }

    public async Task<List<InventoryMovementDto>> GetMovementsByProductAsync(int productId)
    {
        if (!await _db.Products.AnyAsync(p => p.Id == productId))
            throw new NotFoundException("Producto", productId);

        return await GetMovementsAsync(productId);
    }

    // ── Entrada de mercancía ──────────────────────────────────

    public async Task EntryAsync(InventoryEntryRequest request, int userId)
    {
        var product = await _db.Products.FindAsync(request.ProductId)
            ?? throw new NotFoundException("Producto", request.ProductId);

        var prev = product.Stock;
        product.Stock     += request.Quantity;
        product.UpdatedAt  = DateTime.UtcNow;

        await RegisterMovementAsync(
            product.Id, MovementType.Entry,
            request.Quantity, prev, product.Stock,
            request.Reason, null, userId);

        await _db.SaveChangesAsync();
    }

    // ── Salida manual ─────────────────────────────────────────

    public async Task OutputAsync(InventoryOutputRequest request, int userId)
    {
        var product = await _db.Products.FindAsync(request.ProductId)
            ?? throw new NotFoundException("Producto", request.ProductId);

        if (product.Stock < request.Quantity)
            throw new BusinessException(
                $"Stock insuficiente. Disponible: {product.Stock}, solicitado: {request.Quantity}.");

        var prev = product.Stock;
        product.Stock     -= request.Quantity;
        product.UpdatedAt  = DateTime.UtcNow;

        await RegisterMovementAsync(
            product.Id, MovementType.Output,
            request.Quantity, prev, product.Stock,
            request.Reason, null, userId);

        await _db.SaveChangesAsync();
    }

    // ── Ajuste manual (stock absoluto) ────────────────────────

    public async Task AdjustmentAsync(InventoryAdjustmentRequest request, int userId)
    {
        var product = await _db.Products.FindAsync(request.ProductId)
            ?? throw new NotFoundException("Producto", request.ProductId);

        if (request.NewStock < 0)
            throw new BusinessException("El stock no puede ser negativo.");

        var prev      = product.Stock;
        var diff      = request.NewStock - prev;
        product.Stock = request.NewStock;
        product.UpdatedAt = DateTime.UtcNow;

        await RegisterMovementAsync(
            product.Id, MovementType.Adjustment,
            Math.Abs(diff), prev, product.Stock,
            request.Reason ?? $"Ajuste manual: {prev} → {request.NewStock}",
            null, userId);

        await _db.SaveChangesAsync();
    }

    // ── Uso interno: descontar por venta ──────────────────────

    public async Task DiscountStockAsync(int productId, int quantity,
                                         string reference, int userId)
    {
        var product = await _db.Products.FindAsync(productId)
            ?? throw new NotFoundException("Producto", productId);

        var prev = product.Stock;
        product.Stock    -= quantity;
        product.UpdatedAt = DateTime.UtcNow;

        await RegisterMovementAsync(
            product.Id, MovementType.SalePending,
            quantity, prev, product.Stock,
            "Descuento por venta", reference, userId);
    }

    // ── Uso interno: devolver por cancelación ─────────────────

    public async Task ReturnStockAsync(int productId, int quantity,
                                        string reference, int userId)
    {
        var product = await _db.Products.FindAsync(productId)
            ?? throw new NotFoundException("Producto", productId);

        var prev = product.Stock;
        product.Stock    += quantity;
        product.UpdatedAt = DateTime.UtcNow;

        await RegisterMovementAsync(
            product.Id, MovementType.CancellationReturn,
            quantity, prev, product.Stock,
            "Devolución por cancelación", reference, userId);
    }

    // ── Registro del movimiento ───────────────────────────────

    private async Task RegisterMovementAsync(
        int productId, MovementType type, int quantity,
        int prev, int newStock, string? reason,
        string? reference, int userId)
    {
        _db.InventoryMovements.Add(new InventoryMovement
        {
            ProductId     = productId,
            MovementType  = type,
            Quantity      = quantity,
            PreviousStock = prev,
            NewStock      = newStock,
            Reason        = reason,
            Reference     = reference,
            UserId        = userId,
            CreatedAt     = DateTime.UtcNow
        });
    }

    // ── Mapper ────────────────────────────────────────────────

    private static InventoryMovementDto ToDto(InventoryMovement m) => new()
    {
        Id            = m.Id,
        ProductId     = m.ProductId,
        ProductName   = m.Product.Name,
        MovementType  = m.MovementType.ToString(),
        Quantity      = m.Quantity,
        PreviousStock = m.PreviousStock,
        NewStock      = m.NewStock,
        Reason        = m.Reason,
        Reference     = m.Reference,
        UserFullName  = m.User.FullName,
        CreatedAt     = m.CreatedAt
    };
}
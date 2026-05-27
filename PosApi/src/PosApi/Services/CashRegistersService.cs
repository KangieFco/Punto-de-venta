using Microsoft.EntityFrameworkCore;
using PosApi.Common.Exceptions;
using PosApi.Data;
using PosApi.Domain.Entities;
using PosApi.Domain.Enums;
using PosApi.DTOs.CashRegisters;
using PosApi.Services.Interfaces;

namespace PosApi.Services;

public class CashRegisterService : ICashRegisterService
{
    private readonly AppDbContext _db;

    public CashRegisterService(AppDbContext db) => _db = db;

    // ── Apertura ──────────────────────────────────────────────

    public async Task<CashRegisterDto> OpenAsync(OpenCashRegisterRequest request, int userId)
    {
        // No permitir dos cajas abiertas para el mismo usuario
        var alreadyOpen = await _db.CashRegisters
            .AnyAsync(cr => cr.UserId == userId &&
                            cr.Status == CashRegisterStatus.Open);

        if (alreadyOpen)
            throw new BusinessException("Ya tienes una caja abierta. Ciérrala antes de abrir una nueva.");

        var cashRegister = new CashRegister
        {
            UserId        = userId,
            OpeningAmount = request.OpeningAmount,
            Status        = CashRegisterStatus.Open,
            OpenedAt      = DateTime.UtcNow
        };

        _db.CashRegisters.Add(cashRegister);
        await _db.SaveChangesAsync();
        return await GetByIdAsync(cashRegister.Id);
    }

    // ── Cierre ────────────────────────────────────────────────

    public async Task<CashRegisterDto> CloseAsync(int id,
        CloseCashRegisterRequest request, int userId)
    {
        var cashRegister = await _db.CashRegisters
            .Include(cr => cr.Sales)
            .Include(cr => cr.CashMovements)
            .FirstOrDefaultAsync(cr => cr.Id == id)
            ?? throw new NotFoundException("Caja", id);

        if (cashRegister.Status == CashRegisterStatus.Closed)
            throw new BusinessException("Esta caja ya está cerrada.");

        // Calcular monto esperado:
        // apertura + ventas en efectivo + ingresos manuales - retiros
        var cashSales = cashRegister.Sales
            .Where(s => s.Status == SaleStatus.Completed &&
                        s.PaymentMethod == PaymentMethod.Cash)
            .Sum(s => s.Total);

        var manualIn = cashRegister.CashMovements
            .Where(m => m.Type == CashMovementType.In)
            .Sum(m => m.Amount);

        var manualOut = cashRegister.CashMovements
            .Where(m => m.Type == CashMovementType.Out)
            .Sum(m => m.Amount);

        var expected = cashRegister.OpeningAmount + cashSales + manualIn - manualOut;

        cashRegister.ClosingAmount  = request.ClosingAmount;
        cashRegister.ExpectedAmount = expected;
        cashRegister.Difference     = request.ClosingAmount - expected;
        cashRegister.Status         = CashRegisterStatus.Closed;
        cashRegister.ClosedAt       = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return await GetByIdAsync(cashRegister.Id);
    }

    // ── Consultas ─────────────────────────────────────────────

    public async Task<CashRegisterDto?> GetCurrentOpenAsync(int userId)
    {
        var cr = await _db.CashRegisters
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.UserId == userId &&
                                      c.Status == CashRegisterStatus.Open);

        return cr is null ? null : ToDto(cr);
    }

    public async Task<CashRegisterDto> GetByIdAsync(int id)
    {
        var cr = await _db.CashRegisters
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new NotFoundException("Caja", id);

        return ToDto(cr);
    }

    public async Task<List<CashRegisterDto>> GetAllAsync()
    {
        return await _db.CashRegisters
            .Include(c => c.User)
            .OrderByDescending(c => c.OpenedAt)
            .Select(c => ToDto(c))
            .ToListAsync();
    }

    // ── Movimientos manuales ──────────────────────────────────

    public async Task<CashMovementDto> AddIncomingAsync(
        CashMovementRequest request, int userId)
    {
        var registerId = await GetOpenRegisterIdAsync(userId);
        return await AddMovementAsync(registerId, CashMovementType.In,
                                      request, userId);
    }

    public async Task<CashMovementDto> AddOutgoingAsync(
        CashMovementRequest request, int userId)
    {
        var registerId = await GetOpenRegisterIdAsync(userId);
        return await AddMovementAsync(registerId, CashMovementType.Out,
                                      request, userId);
    }

    public async Task<List<CashMovementDto>> GetMovementsAsync(int cashRegisterId)
    {
        return await _db.CashMovements
            .Include(m => m.User)
            .Where(m => m.CashRegisterId == cashRegisterId)
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new CashMovementDto
            {
                Id             = m.Id,
                CashRegisterId = m.CashRegisterId,
                Type           = m.Type.ToString(),
                Amount         = m.Amount,
                Reason         = m.Reason,
                UserFullName   = m.User.FullName,
                CreatedAt      = m.CreatedAt
            })
            .ToListAsync();
    }

    // ── Verificar caja abierta (uso interno) ──────────────────

    public async Task<int> GetOpenRegisterIdAsync(int userId)
    {
        var cr = await _db.CashRegisters
            .FirstOrDefaultAsync(c => c.UserId == userId &&
                                      c.Status == CashRegisterStatus.Open)
            ?? throw new BusinessException(
                "No tienes una caja abierta. Abre una caja antes de continuar.");

        return cr.Id;
    }

    // ── Privados ──────────────────────────────────────────────

    private async Task<CashMovementDto> AddMovementAsync(
        int cashRegisterId, CashMovementType type,
        CashMovementRequest request, int userId)
    {
        var movement = new CashMovement
        {
            CashRegisterId = cashRegisterId,
            Type           = type,
            Amount         = request.Amount,
            Reason         = request.Reason,
            UserId         = userId,
            CreatedAt      = DateTime.UtcNow
        };

        _db.CashMovements.Add(movement);
        await _db.SaveChangesAsync();

        await _db.Entry(movement).Reference(m => m.User).LoadAsync();

        return new CashMovementDto
        {
            Id             = movement.Id,
            CashRegisterId = movement.CashRegisterId,
            Type           = movement.Type.ToString(),
            Amount         = movement.Amount,
            Reason         = movement.Reason,
            UserFullName   = movement.User.FullName,
            CreatedAt      = movement.CreatedAt
        };
    }

    private static CashRegisterDto ToDto(CashRegister cr) => new()
    {
        Id             = cr.Id,
        UserId         = cr.UserId,
        UserFullName   = cr.User.FullName,
        OpeningAmount  = cr.OpeningAmount,
        ClosingAmount  = cr.ClosingAmount,
        ExpectedAmount = cr.ExpectedAmount,
        Difference     = cr.Difference,
        Status         = cr.Status.ToString(),
        OpenedAt       = cr.OpenedAt,
        ClosedAt       = cr.ClosedAt
    };
}
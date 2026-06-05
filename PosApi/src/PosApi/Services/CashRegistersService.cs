using Microsoft.EntityFrameworkCore;
using PosApi.Common;
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

    // ── Abrir caja ────────────────────────────────────────────

    public async Task<CashRegisterDto> OpenAsync(
        OpenCashRegisterRequest request, int userId)
    {
        var alreadyOpen = await _db.CashRegisters
            .AnyAsync(c => c.UserId == userId &&
                           c.Status == CashRegisterStatus.Open);

        if (alreadyOpen)
            throw new BusinessException(
                "Ya tienes una caja abierta. Ciérrala antes de abrir una nueva.");

        var cashRegister = new CashRegister
        {
            UserId        = userId,
            OpeningAmount = request.OpeningAmount,
            Status        = CashRegisterStatus.Open,
            OpenedAt      = DateTimeHelper.Now 
        };

        _db.CashRegisters.Add(cashRegister);
        await _db.SaveChangesAsync();
        return await GetByIdAsync(cashRegister.Id);
    }

    // ── Cerrar caja 

    public async Task<CashRegisterCloseResultDto> CloseAsync(
        int id, CloseCashRegisterRequest request, int userId)
    {
        var cashRegister = await _db.CashRegisters
            .Include(cr => cr.User)
            .Include(cr => cr.Sales)
            .Include(cr => cr.CashMovements)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(cr => cr.Id == id)
            ?? throw new NotFoundException("Caja", id);

        if (cashRegister.Status == CashRegisterStatus.Closed)
            throw new BusinessException("Esta caja ya está cerrada.");

        var completedSales = cashRegister.Sales
            .Where(s => s.Status == SaleStatus.Completed).ToList();

        var cancelledCount = cashRegister.Sales
            .Count(s => s.Status == SaleStatus.Cancelled);

        var cashSales   = completedSales.Where(s => s.PaymentMethod == PaymentMethod.Cash).Sum(s => s.Total);

        var cardSales   = completedSales
            .Where(s => s.PaymentMethod == PaymentMethod.Card)
            .Sum(s => s.Total);

        var dollarSales = completedSales
            .Where(s => s.PaymentMethod == PaymentMethod.Dollar)
            .Sum(s => s.Total);

        var otherSales  = completedSales
            .Where(s => s.PaymentMethod == PaymentMethod.Other)
            .Sum(s => s.Total);

        // Para ventas Mixed, sumar según desglose
        var mixedSales = completedSales
            .Where(s => s.PaymentMethod == PaymentMethod.Mixed && !string.IsNullOrEmpty(s.PaymentBreakdown)).ToList();

        foreach (var ms in mixedSales){
            if (string.IsNullOrWhiteSpace(ms.PaymentBreakdown)) continue;
            foreach (var part in ms.PaymentBreakdown.Split(',')) {
                var lastColon = part.LastIndexOf(':');
                if (lastColon <= 0) continue;
                var methodStr = part[..lastColon].Trim();
                var amountStr = part[(lastColon + 1)..].Trim();
                if (!Enum.TryParse<PaymentMethod>(methodStr, out var method)) continue;
                if (!decimal.TryParse(
                        amountStr,
                        System.Globalization.NumberStyles.Any,
                        System.Globalization.CultureInfo.InvariantCulture,
                        out var amount)) continue;

                if (method == PaymentMethod.Cash) cashSales += amount;
                else if (method == PaymentMethod.Card) cardSales += amount;
                else if (method == PaymentMethod.Dollar) dollarSales += amount;
                else otherSales += amount;
            }
        }

        var manualIn  = cashRegister.CashMovements
            .Where(m => m.Type == CashMovementType.In).Sum(m => m.Amount);
        var manualOut = cashRegister.CashMovements
            .Where(m => m.Type == CashMovementType.Out).Sum(m => m.Amount);

        var expectedCash   = cashRegister.OpeningAmount + cashSales + manualIn - manualOut;
        var expectedAmount = expectedCash;
        cashRegister.ClosingAmount = request.ClosingAmount;
        cashRegister.ExpectedAmount = expectedAmount;
        cashRegister.Difference = request.ClosingAmount - expectedAmount;
        cashRegister.Status = CashRegisterStatus.Closed;
        cashRegister.ClosedAt = DateTimeHelper.Now;

        await _db.SaveChangesAsync();

        var movements = cashRegister.CashMovements
            .OrderBy(m => m.CreatedAt)
            .Select(m => new CashMovementDto {
                Id = m.Id,
                CashRegisterId = m.CashRegisterId,
                Type = m.Type.ToString(),
                Amount = m.Amount,
                Reason = m.Reason,
                UserFullName = m.User.FullName,
                CreatedAt = m.CreatedAt
            }).ToList();

        var salesList = completedSales
            .OrderBy(s => s.CreatedAt)
            .Select(s => new CashRegisterSaleSummary {
                Folio  = s.Folio,
                Total = s.Total,
                PaymentMethod = s.PaymentMethod.ToString(),
                CreatedAt = s.CreatedAt
            }).ToList();

        return new CashRegisterCloseResultDto {
            Id = cashRegister.Id,
            UserFullName = cashRegister.User.FullName,
            OpenedAt = cashRegister.OpenedAt,
            ClosedAt = cashRegister.ClosedAt!.Value,
            OpeningAmount = cashRegister.OpeningAmount,
            ClosingAmount = request.ClosingAmount,
            ExpectedAmount = expectedAmount,
            Difference = cashRegister.Difference!.Value,
            TotalSales = completedSales.Count,
            CancelledSales = cancelledCount,
            TotalRevenue = completedSales.Sum(s => s.Total),
            CashRevenue = cashSales,
            CardRevenue = cardSales,
            DollarRevenue = dollarSales,
            OtherRevenue = otherSales,
            ManualIncoming = manualIn,
            ManualOutgoing = manualOut,
            MovementsCount = cashRegister.CashMovements.Count,
            ExpectedCash = expectedCash,
            Movements = movements,
            SalesList = salesList
        };
    }

    // ── Consultas
    public async Task<CashRegisterDto?> GetCurrentOpenAsync(int userId) {
        var cr = await _db.CashRegisters
            .Include(c => c.User)
            .FirstOrDefaultAsync(c =>
                c.UserId == userId &&
                c.Status == CashRegisterStatus.Open);

        return cr is null ? null : ToDto(cr);
    }

    public async Task<CashRegisterDto> GetByIdAsync(int id) {
        var cr = await _db.CashRegisters
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new NotFoundException("Caja", id);

        return ToDto(cr);
    }

    public async Task<List<CashRegisterDto>> GetAllAsync() {
        var registers = await _db.CashRegisters
            .Include(c => c.User)
            .OrderByDescending(c => c.OpenedAt)
            .ToListAsync();

        return registers.Select(ToDto).ToList();
    }

    // ── Movimientos

    public async Task<CashMovementDto> AddIncomingAsync(
        CashMovementRequest request, int userId)
    {
        var registerId = await GetOpenRegisterIdAsync(userId);
        return await AddMovementAsync(registerId, CashMovementType.In, request, userId); 
    }

    public async Task<CashMovementDto> AddOutgoingAsync(
        CashMovementRequest request, int userId)
    {
        var registerId = await GetOpenRegisterIdAsync(userId);
        return await AddMovementAsync(registerId, CashMovementType.Out, request, userId);
    }

    public async Task<List<CashMovementDto>> GetMovementsAsync(int cashRegisterId) {
        return await _db.CashMovements
            .Include(m => m.User)
            .Where(m => m.CashRegisterId == cashRegisterId)
            .OrderByDescending(m => m.CreatedAt)
            .Select(m => new CashMovementDto {
                Id = m.Id,
                CashRegisterId = m.CashRegisterId,
                Type = m.Type.ToString(),
                Amount = m.Amount,
                Reason = m.Reason,
                UserFullName = m.User.FullName,
                CreatedAt = m.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<int> GetOpenRegisterIdAsync(int userId) {
        var cr = await _db.CashRegisters
            .FirstOrDefaultAsync(c =>
                c.UserId == userId &&
                c.Status == CashRegisterStatus.Open)
            ?? throw new BusinessException(
                "No tienes una caja abierta. " +
                "Abre una caja antes de continuar.");

        return cr.Id;
    }

    // ── Privados 

    private async Task<CashMovementDto> AddMovementAsync(
        int cashRegisterId, CashMovementType type,
        CashMovementRequest request, int userId) {
        var movement = new CashMovement {
            CashRegisterId = cashRegisterId,
            Type = type,
            Amount  = request.Amount,
            Reason = request.Reason,
            UserId = userId,
            CreatedAt = DateTimeHelper.Now  
        };

        _db.CashMovements.Add(movement);
        await _db.SaveChangesAsync();
        await _db.Entry(movement).Reference(m => m.User).LoadAsync();

        return new CashMovementDto {
            Id = movement.Id,
            CashRegisterId = movement.CashRegisterId,
            Type = movement.Type.ToString(),
            Amount = movement.Amount,
            Reason = movement.Reason,
            UserFullName = movement.User.FullName,
            CreatedAt = movement.CreatedAt
        };
    }

    private static CashRegisterDto ToDto(CashRegister cr) => new() {
        Id = cr.Id,
        UserId = cr.UserId,
        UserFullName = cr.User.FullName,
        OpeningAmount = cr.OpeningAmount,
        ClosingAmount = cr.ClosingAmount,
        ExpectedAmount = cr.ExpectedAmount,
        Difference = cr.Difference,
        Status = cr.Status.ToString(),
        OpenedAt = cr.OpenedAt,
        ClosedAt = cr.ClosedAt
    };
}
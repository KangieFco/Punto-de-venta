using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosApi.Common;
using PosApi.Common.Exceptions;
using PosApi.Data;
using PosApi.Domain.Entities;
using PosApi.Domain.Enums;
using PosApi.DTOs.Layaways;
using PosApi.Services.Interfaces;

namespace PosApi.Controllers;

[ApiController]
[Route("api/layaways")]
[Authorize]
public class LayawaysController : ControllerBase
{
    private readonly AppDbContext         _db;
    private readonly ICurrentUserService  _currentUser;
    private readonly IInventoryService    _inventoryService;

    public LayawaysController(
        AppDbContext db,
        ICurrentUserService currentUser,
        IInventoryService inventoryService)
    {
        _db               = db;
        _currentUser      = currentUser;
        _inventoryService = inventoryService;
    }

    // ── GET todos ─────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status = null)
    {
        var query = _db.Layaways
            .Include(l => l.User)
            .Include(l => l.Details).ThenInclude(d => d.Product)
            .Include(l => l.Payments).ThenInclude(p => p.User)
            .Include(l => l.Sale)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(l => l.Status == status);

        var list = await query
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        return Ok(ApiResponse<List<LayawayDto>>.Ok(list.Select(ToDto).ToList()));
    }

    // ── GET por id ────────────────────────────────────────────

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var layaway = await GetFull(id);
        return Ok(ApiResponse<LayawayDto>.Ok(ToDto(layaway)));
    }

    // ── POST crear apartado ───────────────────────────────────

    [HttpPost]
    [Authorize(Roles = "Admin,Cajero,Supervisor,Almacen")]
    public async Task<IActionResult> Create([FromBody] CreateLayawayRequest req)
    {
        // 1. Validar productos
        var productIds = req.Items.Select(i => i.ProductId).Distinct().ToList();
        var products   = await _db.Products
            .Where(p => productIds.Contains(p.Id) && p.Active)
            .ToListAsync();

        if (products.Count != productIds.Count)
            throw new BusinessException(
                "Uno o más productos no encontrados o inactivos.");

        // 2. Validar stock suficiente
        foreach (var item in req.Items)
        {
            var p = products.First(x => x.Id == item.ProductId);
            if (p.Stock < item.Quantity)
                throw new BusinessException(
                    $"Stock insuficiente para '{p.Name}'. " +
                    $"Disponible: {p.Stock}, solicitado: {item.Quantity}.");
        }

        // 3. Construir detalles
        var details = req.Items.Select(item =>
        {
            var p = products.First(x => x.Id == item.ProductId);
            return new LayawayDetail
            {
                ProductId = item.ProductId,
                Quantity  = item.Quantity,
                UnitPrice = p.SalePrice,
                Subtotal  = p.SalePrice * item.Quantity
            };
        }).ToList();

        var total = details.Sum(d => d.Subtotal);

        if (req.Deposit > total)
            throw new BusinessException(
                "El anticipo no puede ser mayor al total.");

        var folio   = await GenerateFolioAsync();
        var userId  = _currentUser.UserId;
        var isFullyPaid = req.Deposit >= total;

        var layaway = new Layaway
        {
            Folio        = folio,
            ClientName   = req.ClientName.Trim(),
            ClientPhone  = req.ClientPhone?.Trim(),
            Total        = total,
            Deposit      = req.Deposit,
            Remaining    = total - req.Deposit,
            Status       = isFullyPaid ? "Completed" : "Pending",
            UserId       = userId,
            CreatedAt    = DateTime.UtcNow,
            UpdatedAt    = DateTime.UtcNow,
            Details      = details,
            CompletedAt  = isFullyPaid ? DateTime.UtcNow : null
        };

        _db.Layaways.Add(layaway);

        // 4. Registrar pago inicial si hay anticipo
        if (req.Deposit > 0)
        {
            _db.LayawayPayments.Add(new LayawayPayment
            {
                Layaway       = layaway,
                Amount        = req.Deposit,
                PaymentMethod = req.PaymentMethod,
                UserId        = userId,
                Notes         = "Anticipo inicial",
                CreatedAt     = DateTime.UtcNow
            });
        }

        // 5. Descontar inventario
        foreach (var item in req.Items)
        {
            await _inventoryService.DiscountStockAsync(
                item.ProductId, item.Quantity,
                $"Apartado {folio}", userId);
        }

        // 6. Si ya está pagado completo → generar venta
        if (isFullyPaid)
        {
            await _db.SaveChangesAsync(); // guardar layaway primero
            await GenerateSaleAsync(layaway, userId);
        }

        await _db.SaveChangesAsync();

        return Ok(ApiResponse<LayawayDto>.Ok(
            ToDto(await GetFull(layaway.Id)),
            "Apartado creado correctamente."));
    }

    // ── POST agregar abono ────────────────────────────────────

    [HttpPost("{id}/deposit")]
    [Authorize(Roles = "Admin,Cajero,Supervisor,Almacen")]
    public async Task<IActionResult> AddDeposit(
        int id, [FromBody] AddDepositRequest req)
    {
        var layaway = await GetFull(id);
        var userId  = _currentUser.UserId;

        if (layaway.Status == "Completed")
            throw new BusinessException("Este apartado ya está completado.");
        if (layaway.Status == "Cancelled")
            throw new BusinessException("Este apartado fue cancelado.");

        if (req.Amount > layaway.Remaining)
            throw new BusinessException(
                $"El abono (${req.Amount}) supera el restante (${layaway.Remaining}).");

        // Registrar pago
        _db.LayawayPayments.Add(new LayawayPayment
        {
            LayawayId     = layaway.Id,
            Amount        = req.Amount,
            PaymentMethod = req.PaymentMethod,
            UserId        = userId,
            Notes         = req.Notes,
            CreatedAt     = DateTime.UtcNow
        });

        layaway.Deposit   += req.Amount;
        layaway.Remaining  = Math.Max(0, layaway.Total - layaway.Deposit);
        layaway.UpdatedAt  = DateTime.UtcNow;

        var isNowComplete = layaway.Remaining <= 0;

        if (isNowComplete)
        {
            layaway.Status      = "Completed";
            layaway.CompletedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();

        // Si se liquidó → generar venta
        if (isNowComplete)
            await GenerateSaleAsync(layaway, userId);

        await _db.SaveChangesAsync();

        return Ok(ApiResponse<LayawayDto>.Ok(
            ToDto(await GetFull(layaway.Id)),
            isNowComplete
                ? "¡Apartado liquidado! Venta generada automáticamente."
                : "Abono registrado correctamente."));
    }

    // ── POST cancelar ─────────────────────────────────────────

    [HttpPost("{id}/cancel")]
    [Authorize(Roles = "Admin,Supervisor")]
    public async Task<IActionResult> Cancel(int id)
    {
        var layaway = await GetFull(id);
        var userId  = _currentUser.UserId;

        if (layaway.Status == "Cancelled")
            throw new BusinessException("Ya está cancelado.");
        if (layaway.Status == "Completed")
            throw new BusinessException(
                "No se puede cancelar un apartado ya completado.");

        layaway.Status    = "Cancelled";
        layaway.UpdatedAt = DateTime.UtcNow;

        // Revertir inventario
        foreach (var detail in layaway.Details)
        {
            await _inventoryService.ReturnStockAsync(
                detail.ProductId, detail.Quantity,
                $"Cancelación apartado {layaway.Folio}", userId);
        }

        await _db.SaveChangesAsync();

        return Ok(ApiResponse.Ok("Apartado cancelado e inventario revertido."));
    }

    // ── Generar venta al liquidar ─────────────────────────────

    private async Task GenerateSaleAsync(Layaway layaway, int userId)
    {
        // Verificar caja abierta del usuario
        var cashRegister = await _db.CashRegisters
            .FirstOrDefaultAsync(cr =>
                cr.UserId == userId &&
                cr.Status == CashRegisterStatus.Open);

        if (cashRegister is null) return; // sin caja → solo marcar completado

        // Método de pago del último abono
        var lastPayment = layaway.Payments
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefault();

        var paymentMethod = lastPayment?.PaymentMethod ?? PaymentMethod.Cash;

        // Folio de venta
        var today     = DateTime.UtcNow.ToString("yyyyMMdd");
        var prefix    = $"VTA-{today}-";
        var lastFolio = await _db.Sales
            .Where(s => s.Folio.StartsWith(prefix))
            .OrderByDescending(s => s.Folio)
            .Select(s => s.Folio)
            .FirstOrDefaultAsync();

        int next = 1;
        if (lastFolio is not null &&
            int.TryParse(lastFolio.Replace(prefix, ""), out var n))
            next = n + 1;

        var saleFolio = $"{prefix}{next:D4}";

        // Crear venta
        var saleDetails = layaway.Details.Select(d => new SaleDetail
        {
            ProductId = d.ProductId,
            Quantity  = d.Quantity,
            UnitPrice = d.UnitPrice,
            Discount  = 0,
            Subtotal  = d.Subtotal
        }).ToList();

        var sale = new Sale
        {
            Folio          = saleFolio,
            UserId         = userId,
            CashRegisterId = cashRegister.Id,
            Subtotal       = layaway.Total,
            Discount       = 0,
            Tax            = 0,
            Total          = layaway.Total,
            PaymentMethod  = paymentMethod,
            AmountReceived = layaway.Total,
            ChangeAmount   = 0,
            ExchangeRate   = 1,
            Status         = SaleStatus.Completed,
            CreatedAt      = DateTime.UtcNow,
            SaleDetails    = saleDetails
        };

        _db.Sales.Add(sale);

        // Ticket
        _db.Tickets.Add(new Ticket
        {
            Sale      = sale,
            Folio     = saleFolio,
            CreatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        // Vincular venta al apartado
        layaway.SaleId = sale.Id;

        // Nota: el inventario YA fue descontado al crear el apartado
        // NO volver a descontarlo aquí
    }

    // ── Helpers ───────────────────────────────────────────────

    private async Task<Layaway> GetFull(int id) =>
        await _db.Layaways
            .Include(l => l.User)
            .Include(l => l.Details).ThenInclude(d => d.Product)
            .Include(l => l.Payments).ThenInclude(p => p.User)
            .Include(l => l.Sale)
            .FirstOrDefaultAsync(l => l.Id == id)
        ?? throw new NotFoundException("Apartado", id);

    private async Task<string> GenerateFolioAsync()
    {
        var prefix = $"APT-{DateTime.UtcNow:yyyyMMdd}-";
        var last   = await _db.Layaways
            .Where(l => l.Folio.StartsWith(prefix))
            .OrderByDescending(l => l.Folio)
            .Select(l => l.Folio)
            .FirstOrDefaultAsync();

        int next = 1;
        if (last is not null &&
            int.TryParse(last.Replace(prefix, ""), out var n))
            next = n + 1;

        return $"{prefix}{next:D4}";
    }

    private static LayawayDto ToDto(Layaway l) => new()
    {
        Id           = l.Id,
        Folio        = l.Folio,
        ClientName   = l.ClientName,
        ClientPhone  = l.ClientPhone,
        Total        = l.Total,
        Deposit      = l.Deposit,
        Remaining    = l.Remaining,
        Status       = l.Status,
        UserFullName = l.User.FullName,
        SaleId       = l.SaleId,
        SaleFolio    = l.Sale?.Folio,
        CreatedAt    = l.CreatedAt,
        CompletedAt  = l.CompletedAt,
        Details = l.Details.Select(d => new LayawayDetailDto
        {
            ProductId   = d.ProductId,
            ProductName = d.Product.Name,
            ImageUrl    = d.Product.ImageUrl,
            Quantity    = d.Quantity,
            UnitPrice   = d.UnitPrice,
            Subtotal    = d.Subtotal
        }).ToList(),
        Payments = l.Payments
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new LayawayPaymentDto
            {
                Id            = p.Id,
                Amount        = p.Amount,
                PaymentMethod = p.PaymentMethod.ToString(),
                UserFullName  = p.User.FullName,
                Notes         = p.Notes,
                CreatedAt     = p.CreatedAt
            }).ToList()
    };
}
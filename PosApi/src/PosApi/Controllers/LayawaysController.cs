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
    private readonly AppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IInventoryService _inventoryService;

    public LayawaysController(
        AppDbContext db,
        ICurrentUserService currentUser,
        IInventoryService inventoryService)
    {
        _db = db;
        _currentUser = currentUser;
        _inventoryService = inventoryService;
    }

    // GET /api/layaways
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status = null)
    {
        var query = _db.Layaways
            .Include(l => l.User)
            .Include(l => l.Details)
                .ThenInclude(d => d.Product)
            .Include(l => l.Payments)
                .ThenInclude(p => p.User)
            .Include(l => l.Sale)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(
                l => l.Status == status);
        }

        var list = await query
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();

        return Ok(
            ApiResponse<List<LayawayDto>>.Ok(
                list.Select(ToDto).ToList()
            )
        );
    }

    // GET /api/layaways/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var layaway = await GetFull(id);

        return Ok(
            ApiResponse<LayawayDto>.Ok(
                ToDto(layaway)
            )
        );
    }

    // POST /api/layaways
    [HttpPost]
    [Authorize(
        Roles = "Admin,Cajero,Supervisor,Almacen"
    )]
    public async Task<IActionResult> Create(
        [FromBody] CreateLayawayRequest req)
    {
        var productIds = req.Items
            .Select(i => i.ProductId)
            .Distinct()
            .ToList();

        var products = await _db.Products
            .Where(p =>
                productIds.Contains(p.Id) &&
                p.Active)
            .ToListAsync();

        if (products.Count != productIds.Count)
        {
            throw new BusinessException(
                "Uno o más productos no encontrados o inactivos."
            );
        }

        foreach (var item in req.Items)
        {
            var product = products.First(
                p => p.Id == item.ProductId);

            if (product.Stock < item.Quantity)
            {
                throw new BusinessException(
                    $"Stock insuficiente para '{product.Name}'. " +
                    $"Disponible: {product.Stock}, " +
                    $"solicitado: {item.Quantity}."
                );
            }
        }

        var details = req.Items
            .Select(item =>
            {
                var product = products.First(
                    p => p.Id == item.ProductId);

                return new LayawayDetail
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = product.SalePrice,
                    Subtotal =
                        product.SalePrice *
                        item.Quantity
                };
            })
            .ToList();

        var total = details.Sum(
            detail => detail.Subtotal);

        if (req.Deposit > total)
        {
            throw new BusinessException(
                "El anticipo no puede ser mayor al total."
            );
        }

        var isFullyPaid =
            total > 0 &&
            req.Deposit >= total;

        var userId = _currentUser.UserId;

        /*
         * Si se va a liquidar desde la creación,
         * primero verificamos que exista una caja abierta.
         *
         * Así evitamos guardar el apartado como Completed
         * sin haber generado la venta.
         */
        int? cashRegisterId = null;

        if (isFullyPaid)
        {
            cashRegisterId =
                await RequireOpenCashRegisterIdAsync(
                    userId);
        }

        var folio = await GenerateFolioAsync();
        var now = DateTimeHelper.Now;

        var layaway = new Layaway
        {
            Folio = folio,

            ClientName =
                req.ClientName.Trim(),

            ClientPhone =
                string.IsNullOrWhiteSpace(
                    req.ClientPhone)
                    ? null
                    : req.ClientPhone.Trim(),

            Total = total,
            Deposit = req.Deposit,

            Remaining = Math.Max(
                0,
                total - req.Deposit),

            Status = isFullyPaid
                ? "Completed"
                : "Pending",

            UserId = userId,

            ExpiresAt =
                now.Date.AddMonths(1),

            CreatedAt = now,
            UpdatedAt = now,

            CompletedAt = isFullyPaid
                ? now
                : null,

            Details = details
        };

        _db.Layaways.Add(layaway);

        /*
         * Registrar el anticipo inicial.
         *
         * No incrementamos nuevamente Deposit porque
         * ya fue asignado al crear el apartado.
         */
        if (req.Deposit > 0)
        {
            var initialPayment =
                new LayawayPayment
                {
                    Layaway = layaway,
                    Amount = req.Deposit,
                    PaymentMethod =
                        req.PaymentMethod,
                    UserId = userId,
                    Notes =
                        "Anticipo inicial",
                    CreatedAt = now
                };

            layaway.Payments.Add(
                initialPayment);
        }

        foreach (var item in req.Items)
        {
            await _inventoryService
                .DiscountStockAsync(
                    item.ProductId,
                    item.Quantity,
                    $"Apartado {folio}",
                    userId
                );
        }

        /*
         * Si el anticipo cubre el total,
         * generamos también la venta y el ticket.
         */
        if (isFullyPaid)
        {
            await GenerateSaleAsync(
                layaway,
                userId,
                cashRegisterId!.Value
            );
        }

        await _db.SaveChangesAsync();

        var created =
            await GetFull(layaway.Id);

        var message = isFullyPaid
            ? $"¡Apartado creado y liquidado! " +
              $"Venta generada automáticamente: " +
              $"{created.Sale?.Folio}."
            : "Apartado creado correctamente.";

        return Ok(
            ApiResponse<LayawayDto>.Ok(
                ToDto(created),
                message
            )
        );
    }

    // POST /api/layaways/{id}/deposit
    [HttpPost("{id:int}/deposit")]
    [Authorize(
        Roles = "Admin,Cajero,Supervisor,Almacen"
    )]
    public async Task<IActionResult> AddDeposit(
        int id,
        [FromBody] AddDepositRequest req)
    {
        var layaway = await GetFull(id);
        var userId = _currentUser.UserId;
        var now = DateTimeHelper.Now;
        var today = now.Date;

        if (layaway.Status == "Completed")
        {
            throw new BusinessException(
                "Este apartado ya está completado."
            );
        }

        if (layaway.Status == "Cancelled")
        {
            throw new BusinessException(
                "Este apartado fue cancelado."
            );
        }

        if (layaway.Status == "Expired")
        {
            throw new BusinessException(
                "Este apartado está vencido."
            );
        }

        if (layaway.ExpiresAt.Date < today)
        {
            throw new BusinessException(
                "Este apartado ya venció. " +
                "Libera el producto para regresar el inventario."
            );
        }

        if (req.Amount <= 0)
        {
            throw new BusinessException(
                "El abono debe ser mayor a cero."
            );
        }

        if (req.Amount > layaway.Remaining)
        {
            throw new BusinessException(
                $"El abono (${req.Amount:F2}) " +
                $"supera el restante " +
                $"(${layaway.Remaining:F2})."
            );
        }

        var newRemaining = Math.Max(
            0,
            layaway.Remaining - req.Amount);

        var isNowComplete =
            newRemaining <= 0;

        /*
         * Antes de aceptar el último abono verificamos
         * que el usuario tenga una caja abierta.
         *
         * Si no hay caja, no se registra el último abono
         * y el apartado permanece pendiente.
         */
        int? cashRegisterId = null;

        if (isNowComplete)
        {
            cashRegisterId =
                await RequireOpenCashRegisterIdAsync(
                    userId);
        }

        /*
         * Agregamos el nuevo pago directamente a la
         * colección cargada del apartado.
         *
         * Así GenerateSaleAsync incluye el último abono
         * al calcular pago efectivo, tarjeta o mixto.
         */
        var payment = new LayawayPayment
        {
            LayawayId = layaway.Id,
            Amount = req.Amount,
            PaymentMethod =
                req.PaymentMethod,
            UserId = userId,
            Notes = req.Notes,
            CreatedAt = now
        };

        layaway.Payments.Add(payment);

        layaway.Deposit += req.Amount;

        layaway.Remaining = Math.Max(
            0,
            layaway.Total -
            layaway.Deposit
        );

        layaway.UpdatedAt = now;

        if (isNowComplete)
        {
            layaway.Status = "Completed";
            layaway.CompletedAt = now;

            await GenerateSaleAsync(
                layaway,
                userId,
                cashRegisterId!.Value
            );
        }

        await _db.SaveChangesAsync();

        var updated = await GetFull(id);

        var message = isNowComplete
            ? $"¡Apartado liquidado! " +
              $"Venta generada automáticamente: " +
              $"{updated.Sale?.Folio}."
            : "Abono registrado correctamente.";

        return Ok(
            ApiResponse<LayawayDto>.Ok(
                ToDto(updated),
                message
            )
        );
    }

    // POST /api/layaways/{id}/cancel
    [HttpPost("{id:int}/cancel")]
    [Authorize(
        Roles = "Admin,Cajero,Supervisor"
    )]
    public async Task<IActionResult> Cancel(
        int id)
    {
        var layaway = await GetFull(id);
        var userId = _currentUser.UserId;
        var now = DateTimeHelper.Now;

        if (layaway.Status == "Cancelled")
        {
            throw new BusinessException(
                "Ya está cancelado."
            );
        }

        if (layaway.Status == "Completed")
        {
            throw new BusinessException(
                "No se puede cancelar un apartado ya completado."
            );
        }

        if (layaway.Status == "Expired")
        {
            throw new BusinessException(
                "Este apartado ya está vencido."
            );
        }

        layaway.Status = "Cancelled";
        layaway.UpdatedAt = now;
        layaway.CompletedAt = now;

        foreach (var detail in layaway.Details)
        {
            await _inventoryService
                .ReturnStockAsync(
                    detail.ProductId,
                    detail.Quantity,
                    $"Cancelación apartado {layaway.Folio}",
                    userId
                );
        }

        await _db.SaveChangesAsync();

        return Ok(
            ApiResponse.Ok(
                "Apartado cancelado e inventario revertido."
            )
        );
    }

    // POST /api/layaways/{id}/expire
    [HttpPost("{id:int}/expire")]
    [Authorize(
        Roles = "Admin,Cajero,Supervisor"
    )]
    public async Task<IActionResult> Expire(
        int id)
    {
        var layaway = await GetFull(id);
        var userId = _currentUser.UserId;
        var now = DateTimeHelper.Now;
        var today = now.Date;

        if (layaway.Status == "Completed")
        {
            throw new BusinessException(
                "No se puede vencer un apartado ya completado."
            );
        }

        if (layaway.Status == "Cancelled")
        {
            throw new BusinessException(
                "Este apartado ya fue cancelado."
            );
        }

        if (layaway.Status == "Expired")
        {
            throw new BusinessException(
                "Este apartado ya está vencido."
            );
        }

        if (layaway.Status != "Pending")
        {
            throw new BusinessException(
                "Solo se pueden vencer apartados pendientes."
            );
        }

        if (layaway.ExpiresAt.Date >= today)
        {
            throw new BusinessException(
                "El apartado aún no está vencido."
            );
        }

        layaway.Status = "Expired";
        layaway.UpdatedAt = now;
        layaway.CompletedAt = now;

        foreach (var detail in layaway.Details)
        {
            await _inventoryService
                .ReturnStockAsync(
                    detail.ProductId,
                    detail.Quantity,
                    $"Vencimiento apartado {layaway.Folio}",
                    userId
                );
        }

        await _db.SaveChangesAsync();

        var updated = await GetFull(id);

        return Ok(
            ApiResponse<LayawayDto>.Ok(
                ToDto(updated),
                "Apartado vencido. " +
                "Productos devueltos al inventario " +
                "y abonos conservados."
            )
        );
    }

    /*
     * Obtiene la caja abierta del usuario.
     *
     * Si no existe, detiene la liquidación para que
     * el apartado no quede Completed sin una venta.
     */
    private async Task<int>
        RequireOpenCashRegisterIdAsync(
            int userId)
    {
        var cashRegisterId =
            await _db.CashRegisters
                .Where(cr =>
                    cr.UserId == userId &&
                    cr.Status ==
                        CashRegisterStatus.Open)
                .Select(cr => (int?)cr.Id)
                .FirstOrDefaultAsync();

        if (!cashRegisterId.HasValue)
        {
            throw new BusinessException(
                "Debes abrir una caja antes de liquidar el apartado."
            );
        }

        return cashRegisterId.Value;
    }

    private async Task GenerateSaleAsync(
        Layaway layaway,
        int userId,
        int cashRegisterId)
    {
        /*
         * Evitar generar dos ventas para el
         * mismo apartado.
         */
        if (layaway.SaleId.HasValue ||
            layaway.Sale is not null)
        {
            return;
        }

        /*
         * Agrupar todos los pagos, incluyendo
         * el último abono agregado a la colección.
         */
        var paymentGroups =
            layaway.Payments
                .GroupBy(
                    payment =>
                        payment.PaymentMethod)
                .Select(group => new
                {
                    Method = group.Key,

                    Amount = group.Sum(
                        payment =>
                            payment.Amount)
                })
                .ToList();

        if (paymentGroups.Count == 0)
        {
            throw new BusinessException(
                "No se encontraron pagos para generar la venta del apartado."
            );
        }

        var paidTotal =
            paymentGroups.Sum(
                group => group.Amount);

        if (paidTotal < layaway.Total)
        {
            throw new BusinessException(
                "Los pagos registrados no cubren el total del apartado."
            );
        }

        var isMixed =
            paymentGroups.Count > 1;

        var mainMethod = isMixed
            ? PaymentMethod.Mixed
            : paymentGroups[0].Method;

        var breakdown = string.Join(
            ",",
            paymentGroups.Select(group =>
                string.Format(
                    System.Globalization
                        .CultureInfo
                        .InvariantCulture,
                    "{0}:{1:F2}",
                    group.Method,
                    group.Amount
                )
            )
        );

        var prefix =
            $"VTA-{DateTimeHelper.Now:yyyyMMdd}-";

        var lastFolio =
            await _db.Sales
                .Where(s =>
                    s.Folio.StartsWith(
                        prefix))
                .OrderByDescending(
                    s => s.Folio)
                .Select(s => s.Folio)
                .FirstOrDefaultAsync();

        var next = 1;

        if (
            lastFolio is not null &&
            int.TryParse(
                lastFolio.Replace(
                    prefix,
                    string.Empty),
                out var currentNumber))
        {
            next =
                currentNumber + 1;
        }

        var saleFolio =
            $"{prefix}{next:D4}";

        var sale = new Sale
        {
            Folio = saleFolio,
            UserId = userId,

            CashRegisterId =
                cashRegisterId,

            Subtotal =
                layaway.Total,

            Discount = 0,
            Tax = 0,

            Total =
                layaway.Total,

            PaymentMethod =
                mainMethod,

            PaymentBreakdown = isMixed
                ? breakdown
                : null,

            AmountReceived =
                paidTotal,

            ChangeAmount =
                Math.Max(
                    0,
                    paidTotal -
                    layaway.Total),

            ExchangeRate = 1,

            Status =
                SaleStatus.Completed,

            CreatedAt =
                DateTimeHelper.Now,

            SaleDetails =
                layaway.Details
                    .Select(detail =>
                        new SaleDetail
                        {
                            ProductId =
                                detail.ProductId,

                            Quantity =
                                detail.Quantity,

                            UnitPrice =
                                detail.UnitPrice,

                            Discount = 0,

                            Subtotal =
                                detail.Subtotal
                        })
                    .ToList()
        };

        _db.Sales.Add(sale);

        /*
         * Relacionar la venta con el apartado.
         * EF asignará SaleId al guardar.
         */
        layaway.Sale = sale;
        layaway.UpdatedAt =
            DateTimeHelper.Now;

        /*
         * Crear el ticket normal asociado a la venta.
         */
        _db.Tickets.Add(
            new Ticket
            {
                Sale = sale,
                Folio = saleFolio,
                CreatedAt =
                    DateTimeHelper.Now
            }
        );
    }

    private async Task<Layaway> GetFull(
        int id)
    {
        return await _db.Layaways
            .Include(l => l.User)
            .Include(l => l.Details)
                .ThenInclude(d => d.Product)
            .Include(l => l.Payments)
                .ThenInclude(p => p.User)
            .Include(l => l.Sale)
            .FirstOrDefaultAsync(
                l => l.Id == id)
            ?? throw new NotFoundException(
                "Apartado",
                id
            );
    }

    private async Task<string>
        GenerateFolioAsync()
    {
        var prefix =
            $"APT-{DateTimeHelper.Now:yyyyMMdd}-";

        var lastFolio =
            await _db.Layaways
                .Where(l =>
                    l.Folio.StartsWith(
                        prefix))
                .OrderByDescending(
                    l => l.Folio)
                .Select(l => l.Folio)
                .FirstOrDefaultAsync();

        var next = 1;

        if (
            lastFolio is not null &&
            int.TryParse(
                lastFolio.Replace(
                    prefix,
                    string.Empty),
                out var currentNumber))
        {
            next =
                currentNumber + 1;
        }

        return $"{prefix}{next:D4}";
    }

    private static LayawayDto ToDto(
        Layaway layaway)
    {
        var today =
            DateTimeHelper.Now.Date;

        var expiresDate =
            layaway.ExpiresAt.Date;

        var daysLeft =
            (expiresDate - today).Days;

        return new LayawayDto
        {
            Id = layaway.Id,
            Folio = layaway.Folio,

            ClientName =
                layaway.ClientName,

            ClientPhone =
                layaway.ClientPhone,

            Total =
                layaway.Total,

            Deposit =
                layaway.Deposit,

            Remaining =
                layaway.Remaining,

            Status =
                layaway.Status,

            UserFullName =
                layaway.User.FullName,

            SaleId =
                layaway.SaleId,

            SaleFolio =
                layaway.Sale?.Folio,

            ExpiresAt =
                layaway.ExpiresAt,

            DaysLeft =
                daysLeft,

            IsExpired =
                layaway.Status ==
                    "Expired" ||
                (
                    layaway.Status ==
                        "Pending" &&
                    expiresDate < today
                ),

            CreatedAt =
                layaway.CreatedAt,

            CompletedAt =
                layaway.CompletedAt,

            Details =
                layaway.Details
                    .Select(detail =>
                        new LayawayDetailDto
                        {
                            ProductId =
                                detail.ProductId,

                            ProductName =
                                detail.Product.Name,

                            ImageUrl =
                                detail.Product.ImageUrl,

                            Quantity =
                                detail.Quantity,

                            UnitPrice =
                                detail.UnitPrice,

                            Subtotal =
                                detail.Subtotal
                        })
                    .ToList(),

            Payments =
                layaway.Payments
                    .OrderByDescending(
                        payment =>
                            payment.CreatedAt)
                    .Select(payment =>
                        new LayawayPaymentDto
                        {
                            Id =
                                payment.Id,

                            Amount =
                                payment.Amount,

                            PaymentMethod =
                                payment.PaymentMethod
                                    .ToString(),

                            UserFullName =
                                payment.User
                                    .FullName,

                            Notes =
                                payment.Notes,

                            CreatedAt =
                                payment.CreatedAt
                        })
                    .ToList()
        };
    }
}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosApi.Common;
using PosApi.DTOs.Inventory;
using PosApi.Services.Interfaces;

namespace PosApi.Controllers;

[ApiController]
[Route("api/inventory")]
[Authorize]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;
    private readonly ICurrentUserService _currentUser;

    public InventoryController(IInventoryService inventoryService,
                                ICurrentUserService currentUser)
    {
        _inventoryService = inventoryService;
        _currentUser      = currentUser;
    }

    // GET /api/inventory/movements
    [HttpGet("movements")]
    [Authorize(Roles = "Admin,Inventario,Cajero")]
    public async Task<IActionResult> GetMovements([FromQuery] int? productId = null)
    {
        var movements = await _inventoryService.GetMovementsAsync(productId);
        return Ok(ApiResponse<List<InventoryMovementDto>>.Ok(movements));
    }

    // GET /api/inventory/movements/product/{productId}
    [HttpGet("movements/product/{productId}")]
    public async Task<IActionResult> GetByProduct(int productId)
    {
        var movements = await _inventoryService.GetMovementsByProductAsync(productId);
        return Ok(ApiResponse<List<InventoryMovementDto>>.Ok(movements));
    }

    // POST /api/inventory/entry
    [HttpPost("entry")]
    [Authorize(Roles = "Admin,Inventario,Cajero")]
    public async Task<IActionResult> Entry([FromBody] InventoryEntryRequest request)
    {
        await _inventoryService.EntryAsync(request, _currentUser.UserId);
        return Ok(ApiResponse.Ok("Entrada registrada correctamente."));
    }

    // POST /api/inventory/output
    [HttpPost("output")]
    [Authorize(Roles = "Admin,Inventario")]
    public async Task<IActionResult> Output([FromBody] InventoryOutputRequest request)
    {
        await _inventoryService.OutputAsync(request, _currentUser.UserId);
        return Ok(ApiResponse.Ok("Salida registrada correctamente."));
    }

    // POST /api/inventory/adjustment
    [HttpPost("adjustment")]
    [Authorize(Roles = "Admin,Inventario")]
    public async Task<IActionResult> Adjustment([FromBody] InventoryAdjustmentRequest request)
    {
        await _inventoryService.AdjustmentAsync(request, _currentUser.UserId);
        return Ok(ApiResponse.Ok("Ajuste registrado correctamente."));
    }

    // GET /api/inventory/low-stock
    [HttpGet("low-stock")]
    [Authorize(Roles = "Admin,Inventario,Supervisor,Cajero")]
    public async Task<IActionResult> LowStock()
    {
        var movements = await _inventoryService.GetMovementsAsync();
        return Ok(ApiResponse<List<InventoryMovementDto>>.Ok(movements));
    }
}
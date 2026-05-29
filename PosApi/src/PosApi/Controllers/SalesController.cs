using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosApi.Common;
using PosApi.DTOs.Sales;
using PosApi.Services.Interfaces;

namespace PosApi.Controllers;

[ApiController]
[Route("api/sales")]
[Authorize]
public class SalesController : ControllerBase
{
    private readonly ISaleService        _saleService;
    private readonly ICurrentUserService _currentUser;

    public SalesController(ISaleService saleService,
                            ICurrentUserService currentUser)
    {
        _saleService = saleService;
        _currentUser = currentUser;
    }

    // POST /api/sales
    [HttpPost]
    [Authorize(Roles = "Admin,Cajero,Supervisor")]
    public async Task<IActionResult> Create([FromBody] CreateSaleRequest request)
    {
        var sale = await _saleService.CreateAsync(request, _currentUser.UserId);
        return CreatedAtAction(nameof(GetById),
            new { id = sale.Id },
            ApiResponse<SaleDto>.Ok(sale, "Venta registrada correctamente."));
    }

    // GET /api/sales
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var sales = await _saleService.GetAllAsync();
        return Ok(ApiResponse<List<SaleDto>>.Ok(sales));
    }

    // GET /api/sales/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var sale = await _saleService.GetByIdAsync(id);
        return Ok(ApiResponse<SaleDto>.Ok(sale));
    }

    // GET /api/sales/folio/{folio}
    [HttpGet("folio/{folio}")]
    public async Task<IActionResult> GetByFolio(string folio)
    {
        var sale = await _saleService.GetByFolioAsync(folio);
        return Ok(ApiResponse<SaleDto>.Ok(sale));
    }

    // POST /api/sales/{id}/cancel
    [HttpPost("{id}/cancel")]
    [Authorize(Roles = "Admin,Supervisor,Cajero")]
    public async Task<IActionResult> Cancel(int id,
        [FromBody] CancelSaleRequest request)
    {
        await _saleService.CancelAsync(id, request, _currentUser.UserId);
        return Ok(ApiResponse.Ok("Venta cancelada correctamente."));
    }
}
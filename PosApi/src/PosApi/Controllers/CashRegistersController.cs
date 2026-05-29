using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosApi.Common;
using PosApi.DTOs.CashRegisters;
using PosApi.Services.Interfaces;

namespace PosApi.Controllers;

[ApiController]
[Route("api/cash-registers")]
[Authorize]
public class CashRegistersController : ControllerBase
{
    private readonly ICashRegisterService _cashService;
    private readonly ICurrentUserService  _currentUser;

    public CashRegistersController(ICashRegisterService cashService,
                                    ICurrentUserService currentUser)
    {
        _cashService = cashService;
        _currentUser = currentUser;
    }

    // POST /api/cash-registers/open
    [HttpPost("open")]
    [Authorize(Roles = "Admin,Inventario,Cajero")]
    public async Task<IActionResult> Open([FromBody] OpenCashRegisterRequest request)
    {
        var result = await _cashService.OpenAsync(request, _currentUser.UserId);
        return Ok(ApiResponse<CashRegisterDto>.Ok(result, "Caja abierta correctamente."));
    }

    // POST /api/cash-registers/{id}/close
    [HttpPost("{id}/close")]
    [Authorize(Roles = "Admin,Inventario,Cajero")]
    public async Task<IActionResult> Close(int id,
        [FromBody] CloseCashRegisterRequest request)
    {
        var result = await _cashService.CloseAsync(id, request, _currentUser.UserId);
        return Ok(ApiResponse<CashRegisterDto>.Ok(result, "Caja cerrada correctamente."));
    }

    // GET /api/cash-registers/current
    [HttpGet("current")]
    [Authorize(Roles = "Admin,Inventario,Cajero")]
    public async Task<IActionResult> GetCurrent()
    {
        var result = await _cashService.GetCurrentOpenAsync(_currentUser.UserId);
        return Ok(ApiResponse<CashRegisterDto?>.Ok(result));
    }

    // GET /api/cash-registers
    [HttpGet]
    [Authorize(Roles = "Admin,Supervisor")]
    public async Task<IActionResult> GetAll()
    {
        var result = await _cashService.GetAllAsync();
        return Ok(ApiResponse<List<CashRegisterDto>>.Ok(result));
    }

    // GET /api/cash-registers/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _cashService.GetByIdAsync(id);
        return Ok(ApiResponse<CashRegisterDto>.Ok(result));
    }
}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosApi.Common;
using PosApi.DTOs.CashRegisters;
using PosApi.Services.Interfaces;

namespace PosApi.Controllers;

[ApiController]
[Route("api/cash-movements")]
[Authorize]
public class CashMovementsController : ControllerBase
{
    private readonly ICashRegisterService _cashService;
    private readonly ICurrentUserService  _currentUser;

    public CashMovementsController(ICashRegisterService cashService,
                                    ICurrentUserService currentUser)
    {
        _cashService = cashService;
        _currentUser = currentUser;
    }

    // POST /api/cash-movements/in
    [HttpPost("in")]
    [Authorize(Roles = "Admin,Supervisor,Cajero")]
    public async Task<IActionResult> In([FromBody] CashMovementRequest request)
    {
        var result = await _cashService.AddIncomingAsync(request, _currentUser.UserId);
        return Ok(ApiResponse<CashMovementDto>.Ok(result, "Ingreso registrado."));
    }

    // POST /api/cash-movements/out
    [HttpPost("out")]
    [Authorize(Roles = "Admin,Supervisor,Cajero")]
    public async Task<IActionResult> Out([FromBody] CashMovementRequest request)
    {
        var result = await _cashService.AddOutgoingAsync(request, _currentUser.UserId);
        return Ok(ApiResponse<CashMovementDto>.Ok(result, "Retiro registrado."));
    }

    // GET /api/cash-movements/cash-register/{cashRegisterId}
    [HttpGet("cash-register/{cashRegisterId}")]
    public async Task<IActionResult> GetByCashRegister(int cashRegisterId)
    {
        var result = await _cashService.GetMovementsAsync(cashRegisterId);
        return Ok(ApiResponse<List<CashMovementDto>>.Ok(result));
    }
}
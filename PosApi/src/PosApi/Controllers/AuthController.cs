using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosApi.Common;
using PosApi.DTOs.Auth;
using PosApi.Services.Interfaces;
using System.Security.Claims;

namespace PosApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
        => _authService = authService;

    // POST /api/auth/login
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(ApiResponse<LoginResponse>.Ok(result, "Login exitoso."));
    }

    // POST /api/auth/logout  (el token se invalida en el cliente)
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout()
        => Ok(ApiResponse.Ok("Sesión cerrada."));

    // GET /api/auth/me
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? User.FindFirstValue("sub")!);

        var result = await _authService.GetCurrentUserAsync(userId);
        return Ok(ApiResponse<UserSessionDto>.Ok(result));
    }
}
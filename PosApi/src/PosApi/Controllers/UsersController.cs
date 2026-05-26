using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosApi.Common;
using PosApi.DTOs.Users;
using PosApi.Services.Interfaces;

namespace PosApi.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
        => _userService = userService;

    // GET /api/users
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await _userService.GetAllAsync();
        return Ok(ApiResponse<List<UserDto>>.Ok(users));
    }

    // GET /api/users/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _userService.GetByIdAsync(id);
        return Ok(ApiResponse<UserDto>.Ok(user));
    }

    // POST /api/users
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request)
    {
        var user = await _userService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById),
            new { id = user.Id },
            ApiResponse<UserDto>.Ok(user, "Usuario creado correctamente."));
    }

    // PUT /api/users/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserRequest request)
    {
        var user = await _userService.UpdateAsync(id, request);
        return Ok(ApiResponse<UserDto>.Ok(user, "Usuario actualizado correctamente."));
    }

    // PATCH /api/users/{id}/activate
    [HttpPatch("{id}/activate")]
    public async Task<IActionResult> Activate(int id)
    {
        await _userService.ActivateAsync(id);
        return Ok(ApiResponse.Ok("Usuario activado."));
    }

    // PATCH /api/users/{id}/deactivate
    [HttpPatch("{id}/deactivate")]
    public async Task<IActionResult> Deactivate(int id)
    {
        await _userService.DeactivateAsync(id);
        return Ok(ApiResponse.Ok("Usuario desactivado."));
    }
}
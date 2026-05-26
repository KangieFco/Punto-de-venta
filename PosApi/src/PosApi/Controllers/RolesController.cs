using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosApi.Common;
using PosApi.Data;

namespace PosApi.Controllers;

[ApiController]
[Route("api/roles")]
[Authorize]
public class RolesController : ControllerBase
{
    private readonly AppDbContext _db;

    public RolesController(AppDbContext db) => _db = db;

    // GET /api/roles
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var roles = await _db.Roles
            .Select(r => new { r.Id, r.Name, r.Description })
            .ToListAsync();

        return Ok(ApiResponse<object>.Ok(roles));
    }
}
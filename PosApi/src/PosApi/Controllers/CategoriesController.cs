using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosApi.Common;
using PosApi.DTOs.Categories;
using PosApi.Services.Interfaces;

namespace PosApi.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
        => _categoryService = categoryService;

    // GET /api/categories?onlyActive=true
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? onlyActive = null)
    {
        var categories = await _categoryService.GetAllAsync(onlyActive);
        return Ok(ApiResponse<List<CategoryDto>>.Ok(categories));
    }

    // GET /api/categories/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var category = await _categoryService.GetByIdAsync(id);
        return Ok(ApiResponse<CategoryDto>.Ok(category));
    }

    // POST /api/categories
    [HttpPost]
    [Authorize(Roles = "Admin,Inventario")]
    public async Task<IActionResult> Create([FromBody] SaveCategoryRequest request)
    {
        var category = await _categoryService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById),
            new { id = category.Id },
            ApiResponse<CategoryDto>.Ok(category, "Categoría creada correctamente."));
    }

    // PUT /api/categories/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Inventario")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveCategoryRequest request)
    {
        var category = await _categoryService.UpdateAsync(id, request);
        return Ok(ApiResponse<CategoryDto>.Ok(category, "Categoría actualizada correctamente."));
    }

    // PATCH /api/categories/{id}/activate
    [HttpPatch("{id}/activate")]
    [Authorize(Roles = "Admin,Inventario")]
    public async Task<IActionResult> Activate(int id)
    {
        await _categoryService.ActivateAsync(id);
        return Ok(ApiResponse.Ok("Categoría activada."));
    }

    // PATCH /api/categories/{id}/deactivate
    [HttpPatch("{id}/deactivate")]
    [Authorize(Roles = "Admin,Inventario")]
    public async Task<IActionResult> Deactivate(int id)
    {
        await _categoryService.DeactivateAsync(id);
        return Ok(ApiResponse.Ok("Categoría desactivada."));
    }
}
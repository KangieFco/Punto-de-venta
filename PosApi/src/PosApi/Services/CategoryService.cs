using Microsoft.EntityFrameworkCore;
using PosApi.Common.Exceptions;
using PosApi.Data;
using PosApi.Domain.Entities;
using PosApi.DTOs.Categories;
using PosApi.Services.Interfaces;

namespace PosApi.Services;

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _db;

    public CategoryService(AppDbContext db) => _db = db;

    public async Task<List<CategoryDto>> GetAllAsync(bool? onlyActive = null)
    {
        var query = _db.Categories.AsQueryable();

        if (onlyActive.HasValue)
            query = query.Where(c => c.Active == onlyActive.Value);

        return await query
            .OrderBy(c => c.Name)
            .Select(c => ToDto(c))
            .ToListAsync();
    }

    public async Task<CategoryDto> GetByIdAsync(int id)
    {
        var category = await _db.Categories.FindAsync(id)
            ?? throw new NotFoundException("Categoría", id);

        return ToDto(category);
    }

    public async Task<CategoryDto> CreateAsync(SaveCategoryRequest request)
    {
        if (await _db.Categories.AnyAsync(c => c.Name == request.Name.Trim()))
            throw new BusinessException($"La categoría '{request.Name}' ya existe.");

        var category = new Category
        {
            Name        = request.Name.Trim(),
            Description = request.Description?.Trim(),
            Active      = true,
            CreatedAt   = DateTime.UtcNow,
            UpdatedAt   = DateTime.UtcNow
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        return ToDto(category);
    }

    public async Task<CategoryDto> UpdateAsync(int id, SaveCategoryRequest request)
    {
        var category = await _db.Categories.FindAsync(id)
            ?? throw new NotFoundException("Categoría", id);

        if (await _db.Categories.AnyAsync(c => c.Name == request.Name.Trim() && c.Id != id))
            throw new BusinessException($"La categoría '{request.Name}' ya existe.");

        category.Name        = request.Name.Trim();
        category.Description = request.Description?.Trim();
        category.UpdatedAt   = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ToDto(category);
    }

    public async Task ActivateAsync(int id)
    {
        var category = await _db.Categories.FindAsync(id)
            ?? throw new NotFoundException("Categoría", id);

        category.Active    = true;
        category.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task DeactivateAsync(int id)
    {
        var category = await _db.Categories.FindAsync(id)
            ?? throw new NotFoundException("Categoría", id);

        category.Active    = false;
        category.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private static CategoryDto ToDto(Category c) => new()
    {
        Id          = c.Id,
        Name        = c.Name,
        Description = c.Description,
        Active      = c.Active,
        CreatedAt   = c.CreatedAt
    };
}
using PosApi.DTOs.Categories;

namespace PosApi.Services.Interfaces;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync(bool? onlyActive = null);
    Task<CategoryDto> GetByIdAsync(int id);
    Task<CategoryDto> CreateAsync(SaveCategoryRequest request);
    Task<CategoryDto> UpdateAsync(int id, SaveCategoryRequest request);
    Task ActivateAsync(int id);
    Task DeactivateAsync(int id);
}
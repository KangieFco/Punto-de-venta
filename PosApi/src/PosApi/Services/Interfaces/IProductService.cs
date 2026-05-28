using PosApi.DTOs.Products;

namespace PosApi.Services.Interfaces;

public interface IProductService
{
    Task<List<ProductDto>> GetAllAsync(bool? onlyActive = null);
    Task<ProductDto> GetByIdAsync(int id);
    Task<ProductDto> GetByBarcodeAsync(string barcode);
    Task<List<ProductDto>> SearchAsync(string query);
    Task<List<ProductDto>> GetLowStockAsync();
    Task<ProductDto> CreateAsync(SaveProductRequest request);
    Task<ProductDto> UpdateAsync(int id, SaveProductRequest request);
    Task UpdateImageAsync(int id, string imageUrl);
    Task ActivateAsync(int id);
    Task DeactivateAsync(int id);
}
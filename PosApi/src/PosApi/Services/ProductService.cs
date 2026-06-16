using Microsoft.EntityFrameworkCore;
using PosApi.Common.Exceptions;
using PosApi.Data;
using PosApi.Domain.Entities;
using PosApi.DTOs.Products;
using PosApi.Services.Interfaces;

namespace PosApi.Services;

public class ProductService : IProductService
{
    private readonly AppDbContext _db;

    public ProductService(AppDbContext db) => _db = db;

    public async Task<List<ProductDto>> GetAllAsync(bool? onlyActive = null)
    {
        var query = _db.Products.Include(p => p.Category).AsQueryable();

        if (onlyActive.HasValue)
            query = query.Where(p => p.Active == onlyActive.Value);

        return await query
            .OrderBy(p => p.Name)
            .Select(p => ToDto(p))
            .ToListAsync();
    }

    public async Task<ProductDto> GetByIdAsync(int id)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id)
            ?? throw new NotFoundException("Producto", id);

        return ToDto(product);
    }

    public async Task<ProductDto> GetByBarcodeAsync(string barcode)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Barcode == barcode && p.Active)
            ?? throw new NotFoundException($"Producto con código de barras '{barcode}' no encontrado.");

        return ToDto(product);
    }

    public async Task<List<ProductDto>> SearchAsync(string query)
    {
        var term = query.Trim().ToLower();

        return await _db.Products
            .Include(p => p.Category)
            .Where(p => p.Active && (
                p.Name.ToLower().Contains(term) ||
                p.Code.ToLower().Contains(term) ||
                (p.Barcode != null && p.Barcode.Contains(term))
            ))
            .OrderBy(p => p.Name)
            .Select(p => ToDto(p))
            .ToListAsync();
    }

    public async Task<List<ProductDto>> GetLowStockAsync()
    {
        return await _db.Products
            .Include(p => p.Category)
            .Where(p => p.Active && p.Stock <= p.MinStock)
            .OrderBy(p => p.Stock)
            .Select(p => ToDto(p))
            .ToListAsync();
    }

    public async Task<ProductDto> CreateAsync(SaveProductRequest request)
    {

        if (!string.IsNullOrWhiteSpace(request.Barcode) &&
        await _db.Products.AnyAsync(p => p.Barcode == request.Barcode.Trim())) throw new BusinessException( $"El código de barras '{request.Barcode}' ya está en uso.");

        if (!await _db.Categories.AnyAsync(c => c.Id == request.CategoryId && c.Active)) throw new NotFoundException("Categoría", request.CategoryId);

        var product = new Product{
            Code = "TEMP",
            Barcode = request.Barcode?.Trim(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            CategoryId = request.CategoryId,
            CostPrice = request.CostPrice,
            SalePrice = request.SalePrice,
            Stock = request.Stock,
            MinStock = request.MinStock,
            Unit = request.Unit.Trim().ToUpper(),
            Active = true,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        product.Code = product.Id.ToString("D3");
        product.UpdatedAt = DateTime.Now;
        await _db.SaveChangesAsync();
        return await GetByIdAsync(product.Id);
    }

    public async Task<ProductDto> UpdateAsync(int id, SaveProductRequest request){
        var product = await _db.Products.FindAsync(id)
            ?? throw new NotFoundException("Producto", id);

        if (!string.IsNullOrWhiteSpace(request.Barcode) &&
            await _db.Products.AnyAsync(p => p.Barcode == request.Barcode.Trim() && p.Id != id))
            throw new BusinessException($"El código de barras '{request.Barcode}' ya está en uso.");

        if (!await _db.Categories.AnyAsync(c => c.Id == request.CategoryId && c.Active))
            throw new NotFoundException("Categoría", request.CategoryId);

        product.Barcode = request.Barcode?.Trim();
        product.Name = request.Name.Trim();
        product.Description = request.Description?.Trim();
        product.CategoryId = request.CategoryId;
        product.CostPrice = request.CostPrice;
        product.SalePrice = request.SalePrice;
        product.Stock = request.Stock;
        product.MinStock = request.MinStock;
        product.Unit = request.Unit.Trim().ToUpper();
        product.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return await GetByIdAsync(product.Id);
    }

    public async Task ActivateAsync(int id){
        var product = await _db.Products.FindAsync(id) ?? throw new NotFoundException("Producto", id);

        product.Active = true;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task UpdateImageAsync(int id, string imageUrl){
        var product = await _db.Products.FindAsync(id) ?? throw new NotFoundException("Producto", id);

        product.ImageUrl  = imageUrl;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }
    public async Task DeactivateAsync(int id){
        var product = await _db.Products.FindAsync(id) ?? throw new NotFoundException("Producto", id);
        product.Active = false;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private static ProductDto ToDto(Product p) => new()
    {
        Id = p.Id,
        Code = p.Code,
        Barcode = p.Barcode,
        Name = p.Name,
        Description = p.Description,
        CategoryId = p.CategoryId,
        CategoryName = p.Category.Name,
        ImageUrl = p.ImageUrl,
        SalePrice = p.SalePrice,
        Stock = p.Stock,
        MinStock = p.MinStock,
        Unit = p.Unit,
        Active = p.Active
    };
}
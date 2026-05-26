using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PosApi.Common;
using PosApi.DTOs.Products;
using PosApi.Services.Interfaces;

namespace PosApi.Controllers;

[ApiController]
[Route("api/products")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
        => _productService = productService;

    // GET /api/products?onlyActive=true
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? onlyActive = null)
    {
        var products = await _productService.GetAllAsync(onlyActive);
        return Ok(ApiResponse<List<ProductDto>>.Ok(products));
    }

    // GET /api/products/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var product = await _productService.GetByIdAsync(id);
        return Ok(ApiResponse<ProductDto>.Ok(product));
    }

    // GET /api/products/search?query=coca
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
            return BadRequest(ApiResponse.Fail("El parámetro query es requerido."));

        var products = await _productService.SearchAsync(query);
        return Ok(ApiResponse<List<ProductDto>>.Ok(products));
    }

    // GET /api/products/barcode/{barcode}
    [HttpGet("barcode/{barcode}")]
    public async Task<IActionResult> GetByBarcode(string barcode)
    {
        var product = await _productService.GetByBarcodeAsync(barcode);
        return Ok(ApiResponse<ProductDto>.Ok(product));
    }

    // GET /api/products/low-stock
    [HttpGet("low-stock")]
    public async Task<IActionResult> GetLowStock()
    {
        var products = await _productService.GetLowStockAsync();
        return Ok(ApiResponse<List<ProductDto>>.Ok(products));
    }

    // POST /api/products
    [HttpPost]
    [Authorize(Roles = "Admin,Inventario")]
    public async Task<IActionResult> Create([FromBody] SaveProductRequest request)
    {
        var product = await _productService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById),
            new { id = product.Id },
            ApiResponse<ProductDto>.Ok(product, "Producto creado correctamente."));
    }

    // PUT /api/products/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Inventario")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveProductRequest request)
    {
        var product = await _productService.UpdateAsync(id, request);
        return Ok(ApiResponse<ProductDto>.Ok(product, "Producto actualizado correctamente."));
    }

    // PATCH /api/products/{id}/activate
    [HttpPatch("{id}/activate")]
    [Authorize(Roles = "Admin,Inventario")]
    public async Task<IActionResult> Activate(int id)
    {
        await _productService.ActivateAsync(id);
        return Ok(ApiResponse.Ok("Producto activado."));
    }

    // PATCH /api/products/{id}/deactivate
    [HttpPatch("{id}/deactivate")]
    [Authorize(Roles = "Admin,Inventario")]
    public async Task<IActionResult> Deactivate(int id)
    {
        await _productService.DeactivateAsync(id);
        return Ok(ApiResponse.Ok("Producto desactivado."));
    }
}
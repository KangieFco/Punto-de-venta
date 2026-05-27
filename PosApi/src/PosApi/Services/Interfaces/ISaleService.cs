using PosApi.DTOs.Sales;

namespace PosApi.Services.Interfaces;

public interface ISaleService
{
    Task<SaleDto> CreateAsync(CreateSaleRequest request, int userId);
    Task<List<SaleDto>> GetAllAsync();
    Task<SaleDto> GetByIdAsync(int id);
    Task<SaleDto> GetByFolioAsync(string folio);
    Task CancelAsync(int id, CancelSaleRequest request, int userId);
}
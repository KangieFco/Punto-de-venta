using PosApi.Domain.Enums;
using PosApi.DTOs.Inventory;

namespace PosApi.Services.Interfaces;

public interface IInventoryService
{
    Task<List<InventoryMovementDto>> GetMovementsAsync(int? productId = null);
    Task<List<InventoryMovementDto>> GetMovementsByProductAsync(int productId);
    Task EntryAsync(InventoryEntryRequest request, int userId);
    Task OutputAsync(InventoryOutputRequest request, int userId);
    Task AdjustmentAsync(InventoryAdjustmentRequest request, int userId);

    // Uso interno desde SaleService
    Task DiscountStockAsync(int productId, int quantity,
                            string reference, int userId);
    Task ReturnStockAsync(int productId, int quantity,
                          string reference, int userId);
}